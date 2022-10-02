import fs from 'fs/promises'
import path from 'path'
import {SourceMapGenerator} from 'source-map'

import appRoot from '../../utils/project-root'
import {getImportsAsString} from './imports'
import {getModuleParametersAsString, getModulesAsString} from './modules'

const outputDir = appRoot.resolve('node_modules', '.cache', 'cherry-cola')
const outputPath = path.join(outputDir, 'modules.js')

export async function buildFile() {
    const sourcemap = new SourceMapGenerator()

    const header = [
        'export const modules = new Map()',
        'export const states = new Map()',
        'export const modulesParametersMap = new Map()',
    ].join("\n")

    const importsString = getImportsAsString()
    const parametersString = getModuleParametersAsString()

    const modulesLinesOffset = [importsString, header, parametersString]
        .map(part => part.split("\n").length)
        .reduce((a, b) => a + b)

    const modulesString = await getModulesAsString(sourcemap, modulesLinesOffset)
    const modulesJsContents = [
        importsString,
        header,
        parametersString,
        modulesString
    ].join("\n")

    await fs.writeFile(outputPath, modulesJsContents + "\n" +
        `//# sourceMappingURL=data:application/json;base64,${(new Buffer(sourcemap.toString())).toString('base64')}`
    )
}
