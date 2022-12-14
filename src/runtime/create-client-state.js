const states = new Map()

function MakeMutable(PrimitiveWrapper) {
    return class Mutable extends PrimitiveWrapper {
        constructor(value) {
            super(value)
            this.value = value
        }

        valueOf() {
            return this.value
        }

        clone() {
            return new Mutable(this.valueOf())
        }
    }
}

const constructorsThatCanBeCalledToCreateAClone = [Map, Set]

function cloneStateValue(value) {
    if (value.constructor.name === 'Mutable')
        return value.clone()
    else if (value.constructor === {}.constructor)
        return {...value}
    else if (Array.isArray(value))
        return [...value]
    else if (constructorsThatCanBeCalledToCreateAClone.includes(value.constructor))
        return new value.constructor(value)
}

export function getState(id) {
    return states.get(id)
}

function getValueOf(value) {
    return value.hasOwnProperty('valueOf') ? value.valueOf() : value
}

export function createClientState(value, id) {
    const immutableWrapper = {
        'boolean': Boolean,
        'number': Number,
        'string': String
    }[typeof value]
    states.set(id, immutableWrapper ? new (MakeMutable(immutableWrapper))(value) : value)
    const clone = cloneStateValue(states.get(id))

    function changeValue(newValue) {
        const state = states.get(id)
        const stateValue = getValueOf(state)
        if (stateValue === newValue) {
            return false
        }
        states.get(id).value = newValue
        clone.value = newValue
        updateStateInElementText(id)
        return true
    }

    return [clone, changeValue]
}

// todo: states in attributes

let stateMappings = {}

export function registerStateMappings(sm) {
    stateMappings = sm
}

function updateStateInElementText(stateId) {
    stateMappings[stateId]?.forEach(usage => {
        // todo: take "childrenBefore" into account
        usage.element.innerText = usage.content
            .map(getValueOf)
            .join('')
    })
}
