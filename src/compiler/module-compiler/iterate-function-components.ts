import IPOS from 'ipos'

import {default as iposPromise} from '../../ipos.js'
import {isVirtualElement, VirtualElement} from '../../jsx/VirtualElement'
import {ElementChild, ElementChildren} from '../../jsx/ElementChildren'
import FileTree, {Import} from '../helpers/FileTree'
import {isElementChildren} from '../../jsx/dom/render'

const ipos: IPOS = await iposPromise

let moduleCollector: {
    currentFile?: string,
    parentFile?: string
}
const importTrees: Array<FileTree> = ipos.importTrees as Array<FileTree>

export function iterateFunctionComponents(element: VirtualElement, isFirstCall: boolean = false) {
    if (isFirstCall) {
        if (!ipos.moduleCollector) {
            ipos.create('moduleCollector', {})
            moduleCollector = ipos.moduleCollector
        }
        moduleCollector.currentFile = process.env.CHERRY_COLA_ENTRY
    }

    if (element.type === 'function') {
        const currentFilesImports: Import[] = importTrees.map((tree: FileTree) =>
            tree.find(moduleCollector.currentFile)
        ).filter(v => v)[0]?.imports
        const functionComponentsFile: FileTree = currentFilesImports.find((imp: Import) =>
            Array.from(Object.values(imp.specifiers)).includes(element.function.name)
        )?.fileTree

        moduleCollector.parentFile = moduleCollector.currentFile
        moduleCollector.currentFile = functionComponentsFile?.filename

        const returnedVirtualElement: VirtualElement | ElementChildren = element.function({
            ...element.props,
            children: element.children
        })
        if (isElementChildren(returnedVirtualElement)) {
            Array.from(returnedVirtualElement).forEach((el, i) => {
                el.trace(i, element.id)
                iterateFunctionComponents(el)
            })
            return
        } else {
            returnedVirtualElement.render(0, element.id)
            iterateFunctionComponents(returnedVirtualElement)
            return
        }
    }

    if (element.props.ref) {
        element.props.ref.populate(element)
    }

    const filteredChildren: ElementChildren = element.children.flat().filter(v => v)
    let i = 0
    filteredChildren.forEach(child => {
        if (!isVirtualElement(child)) return
        child.trace(i++, element.id)
        if (child.type === 'function')
            iterateFunctionComponents(child)
    })

    if (isFirstCall) {
        ipos.delete('moduleCollector')
    }
}
