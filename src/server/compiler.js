import path from 'path'
import fs from 'fs'
import webpack from 'webpack'

import autoprefixer from 'autoprefixer'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'

import appRoot from 'app-root-path'
import ora from 'ora'
import chalk from 'chalk'

import {baseConfig} from './compiler.base.js'

export const outputPath = appRoot.resolve(path.join('node_modules', '.cache', 'cherry-cola', 'client'))

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
const compilerBase = webpack({
    ...baseConfig,
    target: 'web',
    output: {
        path: outputPath,
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
compilerBase.watch({}, async (err, stats) => {
    const jsFile = path.join(outputPath, 'main.js')
    if (fs.existsSync(jsFile))
        await fs.rmSync(jsFile)
})

let isFirstCompilation = true
let wasRunning = false, runningMessage, startingTime
setInterval(() => {
    // started running
    if (!compilerBase.idle && !wasRunning) {
        // show compiling in console
        startingTime = Date.now()
        runningMessage = ora(
            chalk.blue(`webpack: `) +
            (!isFirstCompilation ? 'Compiling changes' : 'Compiling assets')
        ).start()
        runningMessage.color = 'cyan'
    } else // stopped running
    if (compilerBase.idle && wasRunning) {
        const duration = Date.now() - startingTime
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
    wasRunning = !compilerBase.idle
}, 1)