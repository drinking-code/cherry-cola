import path from 'path'
import fs from 'fs'
import webpack from 'webpack'
import PrettyError from 'pretty-error'

import autoprefixer from 'autoprefixer'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'

import appRoot from 'app-root-path'
import ora from 'ora'
import chalk from 'chalk'

import {baseConfig} from './compiler.base.js'

export const outputPath = appRoot.resolve(path.join('node_modules', '.cache', 'cherry-cola', 'client'))
const pe = new PrettyError()

const postcssAndSass = [{
    loader: 'postcss-loader',
    options: {
        sourceMap: true,
        postcssOptions: {
            plugins: [autoprefixer],
        },
    }
}, {
    loader: 'resolve-url-loader',
    options: {
        sourceMap: true,
    }
}, {
    loader: 'sass-loader',
    options: {
        sourceMap: true,
    }
},]
const compiler = webpack({
    ...baseConfig,
    target: 'web',
    output: {
        ...baseConfig.output,
        path: outputPath,
        filename: '_remove_me.js',
        clean: {
            keep: /\.js$/,
        }
    },
    module: {
        rules: [...baseConfig.module.rules, {
            test: /\.(png|svg)$/i,
            type: 'asset/resource',
        }, {
            test: /\.s?[ac]ss$/i,
            exclude: /\.module\.s?[ac]ss$/i,
            use: [{
                loader: MiniCssExtractPlugin.loader,
            }, {
                loader: 'css-loader',
                options: {
                    importLoaders: postcssAndSass.length,
                    sourceMap: true,
                }
            }, ...postcssAndSass]
        },],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'style.css',
        }),
    ],
})

if (!global['cherry-cola'])
    global['cherry-cola'] = {}

compiler.watch({}, async (err, stats) => {
    global['cherry-cola'].currentStats = stats.toJson()
    const jsFileName = '_remove_me.js'
    const jsFilePath = path.join(outputPath, jsFileName)
    global['cherry-cola'].clientAssets = stats.toJson().assets.filter(asset => asset.name !== jsFileName)
    if (fs.existsSync(jsFilePath))
        await fs.rmSync(jsFilePath)
    if (err)
        console.log(pe.render(err))
})

let isFirstCompilation = true
let wasRunning = false, runningMessage
setInterval(() => {
    // started running
    if (!compiler.idle && !wasRunning) {
        // show compiling in console
        runningMessage = ora(
            chalk.blue(`webpack: `) +
            (!isFirstCompilation ? 'Compiling changes' : 'Compiling assets')
        ).start()
        runningMessage.color = 'cyan'
    } else // stopped running
    if (compiler.idle && wasRunning) {
        const duration = global['cherry-cola'].currentStats.time
        // stop showing compiling in console
        // show compiling complete in console
        runningMessage.stopAndPersist({
            text: chalk.blue(`webpack: `) +
                (!isFirstCompilation ? 'Compiled changes in ' : 'Compiled assets in ') +
                chalk.bold(`${duration} ms`),
            symbol: chalk.green('✓')
        })
        runningMessage = null
        isFirstCompilation = false
    }
    wasRunning = !compiler.idle
}, 1)