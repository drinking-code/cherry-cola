import isState from '../../state/is-state'
import {isRef} from '../../jsx/create-ref'

export function stringify(value) {
    // todo: serialize complex parameters (such as imports) -> imports with "currentFile"
    if (isState(value)) {
        return `createClientState(${value.value}, '${value.$$stateId.serialize()}')`
    } else if (isRef(value)) {
        return `findElement(${value.stringify()})`
    } else if (Array.isArray(value) || value.constructor === {}.constructor) {
        // todo recursively serialise values
        return JSON.stringify(value)
    } else if (['number', 'string', 'function'].includes(typeof value) || value.toString)
        return value.toString()
    // todo
}
