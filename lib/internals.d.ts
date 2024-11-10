export {};
/**
 * Auto-effect for setting internals of a Web Component according to a given state
 *
 * @since 0.9.0
 * @param {string} state - state key bounded to the element internal
 * @param {InternalsUpdater<E, T>} updater - updater object containing key, read, update, and delete methods
 * /
const updateInternal = <E extends Capsula, T>(
    state: string,
    updater: InternalUpdater<E, T>,
) => (host: E): void => {
    if (!host.internals) return
    const { parser, initial, read, update } = updater
    const proto = host.constructor as typeof Capsula
    proto.states[state] = parser
    host.set(state, initial(host), false)
    effect(() => {
        const current = read(host)
        const value = isFunction(state) ? state(current) : host.get<T>(state)
        const action = null == value && updater.delete
            ? updater.delete(host)
            : update(host, value)
        if (!Object.is(value, current)) enqueue(action, [host, `i:${state}`])
    })
}

/**
 * Toggle an internal state of an element based on given state
 *
 * @since 0.9.0
 * @param {string} name - name of internal state to be toggled
 * @param {string} ariaProp - aria property to be updated when internal state changes
 * /
const toggleInternal = <E extends Capsula>(
    name: string,
    ariaProp?: string
) => updateInternal(name, {
    parser: asBoolean,
    initial:  (el: E) => el.hasAttribute(name),
    read: (el: E) => el.internals.states.has(name),
    update: (el: E, value: boolean) => () => {
            el.internals.states[value ? 'add' : 'delete'](name)
            if (ariaProp) {
                el.internals[ariaProp] = String(value)
                el.setAttribute(`${ARIA_PREFIX}-${name}`, String(value))
            }
            el.toggleAttribute(name, value)
            return el
        }
})

/**
 * Set ElementInternals ARIA property and attribute based on given state
 *
 * @since 0.9.0
 * @param {string} name - name of internal state to be toggled
 * @param {string} ariaProp - aria property to be updated when internal state changes
 * /
const setInternal = <E extends Capsula>(
    name: string,
    ariaProp: string,
    parser: AttributeParser<unknown>
) => updateInternal(name, {
    parser,
    initial:  (el: E) => el.getAttribute(`aria-${name}`),
    read: (el: E) => parse(el, name, el.internals[ariaProp]),
    update: (el: E, value: any) => () => {
            el.internals[ariaProp] = value
            el.setAttribute(`${ARIA_PREFIX}-${name}`, value)
            return el
        },
    delete: (el: E) => () => {
        el.internals[ariaProp] = undefined
        el.removeAttribute(`${ARIA_PREFIX}-${name}`)
        return el
    }
})

/**
 * Use element internals; will setup the global disabled and hidden states if they are observed attributes
 * /
const useInternals = (host: Capsula): boolean => {
    if (!host.internals) host.internals = host.attachInternals()
    const proto = host.constructor as typeof Capsula
    const map = new Map<string, ((host: Capsula) => boolean)>([
        [STATES.busy, useBusy],
        [STATES.current, useCurrent],
        [STATES.disabled, useDisabled],
        [STATES.hidden, useHidden],
    ])
    const role = host.role
    if (null != role) {
        if (ROLES_CHECKED.includes(role)) map.set(STATES.checked, useChecked)
        if (ROLES_EXPANDED.includes(role)) map.set(STATES.expanded, useExpanded)
        if (role === ROLES.button) map.set(STATES.pressed, usePressed)
        if (ROLES_SELECTED.includes(role)) map.set(STATES.selected, useSelected)
    }
    for (const [attr, hook] of map) {
        if (proto.observedAttributes.includes(attr)) hook(host)
    }
    return true
}

/**
 * Use a busy state for a live region and sync it with element internals and aria properties
 *
 * @since 0.9.0
 * @param {Capsula} host - host Capsula
 * @returns {boolean} - whether the busy state was successfully setup
 * /
const useBusy = (host: Capsula): boolean => {
    host.internals.ariaLive = 'polite'
    return booleanInternal(host, STATES.busy)
}

/**
 * Use a checked state and sync it with element internals and aria properties
 *
 * @since 0.9.0
 * @param {Capsula} host - host Capsula
 * @param {boolean} [isTriState=false] - whether to support tri-state checked state
 * @returns {boolean} - whether the checked state was successfully setup
 * /
const useChecked = (host: Capsula, isTriState: boolean = false): boolean => {
    const role = host.role
    if (null == role) return false
    const [key, prop] = getPair(STATES.checked)
    if (!validateRole(role, ROLES_CHECKED, host, key)) return false
    const allowsTriState = [ROLES.checkbox, ROLES.menuitemcheckbox, ROLES.option]
    if (isTriState && !hasRole(role, allowsTriState) && isTriState) {
        log(role, `Role for ${elementName(host)} does not support tri-state aria-checked. Use one of ${valueString(allowsTriState)} instead.`, LOG_WARN)
        isTriState = false
    }
    if (isTriState) setInternal(key, `${ARIA_PREFIX}${prop}`, asEnum(ENUM_TRISTATE))(host)
    else toggleInternal(key, `${ARIA_PREFIX}${prop}`)(host)
    return true
}

const useCurrent = (host: Capsula, isEnumState: boolean = false): boolean => {
    if (isEnumState) stringInternal(host, STATES.current, asEnum(ENUM_CURRENT))
    else booleanInternal(host, STATES.current)
    return true
}

/**
 * Use a disabled state and sync it with element internals and aria properties
 *
 * @since 0.9.0
 * @param {Capsula} host - host Capsula
 * @returns {boolean} - whether the disabled state was successfully setup
 * /
const useDisabled = (host: Capsula): boolean =>
    booleanInternal(host, STATES.disabled)

/**
 * Use an expanded state and sync it with element internals and aria properties
 *
 * @since 0.9.0
 * @param {Capsula} host - host Capsula
 * @returns {boolean} - whether the expanded state was successfully setup
 * /
const useExpanded = (host: Capsula): boolean =>
    booleanInternal(host, STATES.expanded, ROLES_EXPANDED)

/**
 * Use a hidden state and sync it with element internals and aria properties
 *
 * @since 0.9.0
 * @param {Capsula} host - host Capsula
 * @returns {boolean} - whether the hidden state was successfully setup
 * /
const useHidden = (host: Capsula): boolean =>
    booleanInternal(host, STATES.hidden)

/**
 * Use an invalid state and sync it with element internals and aria properties
 *
 * @since 0.9.0
 * @param {Capsula} host - host Capsula
 * @returns {boolean} - whether the invalid state was successfully setup
 ** /
const useInvalid = (host: Capsula): boolean => {
    log(host, 'Invalid state is not yet supported.', LOG_WARN)
    // Implementation pending - we need to use checkValidity() / setValidity() instead of boolean internal
    return false
} */
/**
 * Use a pressed state and sync it with element internals and aria properties
 *
 * @since 0.9.0
 * @param {Capsula} host - host Capsula
 * @returns {boolean} - whether the pressed state was successfully setup
 * /
const usePressed = (host: Capsula, isTriState: boolean = false): boolean => {
    const role = host.role
    const [key, prop] = getPair(STATES.pressed)
    if (!validateRole(role, [ROLES.button], host, key)) return false
    if (isTriState) setInternal(key, `${ARIA_PREFIX}${prop}`, asEnum(ENUM_TRISTATE))(host)
    else toggleInternal(key, `${ARIA_PREFIX}${prop}`)(host)
    return true
}

/**
 * Use a selected state and sync it with element internals and aria properties
 *
 * @since 0.9.0
 * @param {Capsula} host - host Capsula
 * @returns {boolean} - whether the selected state was successfully setup
 * /
const useSelected = (host: Capsula): boolean =>
    booleanInternal(host, STATES.selected, ROLES_SELECTED)

export {
    toggleInternal, setInternal, useBusy, useChecked, useCurrent, useInternals,
    useDisabled, useExpanded, useHidden, usePressed, useSelected,
} */ 