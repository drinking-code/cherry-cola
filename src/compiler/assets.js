import path from 'path'
import esbuild from 'esbuild'
import PrettyError from 'pretty-error'

import appRoot from '../utils/project-root.js'

import {extendBaseConfig, isProduction} from './base.js'
import {showCompilationStatus} from './helpers/logger.js'
import {reportNewAsset} from '../server/dynamic-code-synchronisation/report.js'
import {imageLoader} from '../imports/images.ts'
import {outputPath as modulesJsPath} from './module-compiler/index'
import {default as iposPromise} from '../ipos.ts'
import moduleRoot from '../utils/module-root.js'

export const outputPath = appRoot.resolve('node_modules', '.cache', 'cherry-cola', 'client')
const pe = new PrettyError()

const ipos = await iposPromise
ipos.create('clientAssets', ['main.js', 'main.css'])

const label = 'client-side'

export const endEventTarget = new EventTarget()
const endEvent = new CustomEvent('end')

// todo: clear modulesJsPath before initial build to remove previous errors
const resultPromise = esbuild.build(extendBaseConfig({
    entryPoints: [modulesJsPath],
    inject: [moduleRoot.resolve('src', 'runtime', 'index.js')],
    outfile: path.join(outputPath, 'main.js'),
    sourcemap: !isProduction && 'linked',
    plugins: [
        imageLoader({path: outputPath}),
        showCompilationStatus(typeof Bun !== 'undefined' ? label
            : (await import('chalk')).default.bgBlue(` ${label} `)
        ), {
            name: 'renderend-event',
            setup(build) {
                build.onEnd(async () => {
                    endEventTarget.dispatchEvent(endEvent)
                })
            }
        },
    ],
    watch: process.env.BUN_ENV === 'development' && {
        async onRebuild(error, result) {
            if (error)
                return console.log(pe.render(error))

        },
    },
}))

export async function stopAssetsCompiler() {
    const result = await resultPromise
    if (!result || !result.stop) return
    result.stop()
}
