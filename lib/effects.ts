import { effect } from '@efflore/cause-effect'
import { ce, ra, re, rs, sa, ss, st, ta, tc } from '@efflore/pulse'

import { isFunction, isString } from './util'
import { parse } from './parse'
import type { Capsula } from './capsula'

/* === Types === */

type ElementUpdater<E extends Element, T> = {
    read: (element: E) => T | null,
    update: (element: E, value: T) => Promise<E | null>,
    delete?: (element: E) => Promise<E | null>,
}

type StateKeyOrFunction<T> = PropertyKey | ((v?: T | null) => T)

/* === Exported Functions === */

/**
 * Auto-Effect to emit a custom event when a state changes
 * 
 * @since 0.8.3
 * @param {string} event - event name to dispatch
 * @param {StateLike<unknown>} state - state key
 */
const emit = <E extends Element>(
	event: string,
	state: StateKeyOrFunction<unknown> = event
) => (host: Capsula, target: E): void => effect(() => {
		target.dispatchEvent(new CustomEvent(event, {
			detail: host.get(state),
			bubbles: true
		}))
	})

/**
 * Auto-effect for setting properties of a target element according to a given state
 * 
 * @since 0.9.0
 * @param {StateKeyOrFunction<T>} state - state bound to the element property
 * @param {ElementUpdater} updater - updater object containing key, read, update, and delete methods
 */
const updateElement = <E extends Element, T>(
	state: StateKeyOrFunction<T>,
	updater: ElementUpdater<E, T>
) => (host: Capsula, target: E): void => {
	const { read, update } = updater
	const fallback = read(target)
	if (!isFunction(state)) {
		const value = isString(state) && isString(fallback)
			? parse(host, state, fallback)
			: fallback
		host.set(state, value, false)
	}
	effect(() => {
		const current = read(target)
		const value = isFunction(state) ? state(current) : host.get<T>(state)
		if (!Object.is(value, current)) {

			// A value of null triggers deletion
			if (null === value && updater.delete) updater.delete(target)
			
			// A value of undefined triggers reset to the default value
			else if (null == value && fallback) update(target, fallback)

			// Otherwise, update the value
			else if (null != value) update(target, value)

			// Do nothing if value is nullish and neither delete method or fallback value is provided
		}
	})
}

/**
 * Create an element with a given tag name and optionally set its attributes
 * 
 * @since 0.9.0
 * @param {string} tag - tag name of the element to create
 * @param {StateKeyOrFunction<Record<string, string>>} state - state bound to the element's attributes
 */
const createElement = (
    tag: string,
    state: StateKeyOrFunction<Record<string, string>>
) => updateElement(state, {
	read: () => null,
	update: (el: Element, value) => ce(el, tag, value),
})

/**
 * Remove an element from the DOM
 * 
 * @since 0.8.0
 */
const removeElement = <E extends Element>(
	state: StateKeyOrFunction<boolean>
) => updateElement(state, {
	read: (el: E) => null != el,
    update: (el: E, value: boolean) => value ? re(el) : Promise.resolve(null)
})

/**
 * Set text content of an element
 * 
 * @since 0.8.0
 * @param {StateKeyOrFunction<string>} state - state bound to the text content
 */
const setText = <E extends Element>(
	state: StateKeyOrFunction<string>
) => updateElement(state, {
	read: (el: E) => el.textContent,
	update: (el: E, value) => st(el, value)
})

/**
 * Set property of an element
 * 
 * @since 0.8.0
 * @param {PropertyKey} key - name of property to be set
 * @param {StateKeyOrFunction<unknown>} state - state bound to the property value
 */
const setProperty = <E extends Element>(
	key: PropertyKey,
	state: StateKeyOrFunction<unknown> = key
) => updateElement(state, {
	read: (el: E) => (el as Record<PropertyKey, any>)[key],
	update: (el: E, value: any) => (el as Record<PropertyKey, any>)[key] = value,
})

/**
 * Set attribute of an element
 * 
 * @since 0.8.0
 * @param {string} name - name of attribute to be set
 * @param {StateKeyOrFunction<string>} state - state bound to the attribute value
 */
const setAttribute = <E extends Element>(
	name: string,
	state: StateKeyOrFunction<string> = name
) => updateElement(state, {
	read: (el: E) => el.getAttribute(name),
	update: (el: E, value: string) => sa(el, name, value),
	delete: (el: E) => ra(el, name)
})

/**
 * Toggle a boolan attribute of an element
 * 
 * @since 0.8.0
 * @param {string} name - name of attribute to be toggled
 * @param {StateKeyOrFunction<boolean>} state - state bound to the attribute existence
 */
const toggleAttribute = <E extends Element>(
	name: string,
	state: StateKeyOrFunction<boolean> = name
) => updateElement(state, {
	read: (el: E) => el.hasAttribute(name),
	update: (el: E, value: boolean) => ta(el, name, value)
})

/**
 * Toggle a classList token of an element
 * 
 * @since 0.8.0
 * @param {string} token - class token to be toggled
 * @param {StateKeyOrFunction<boolean>} state - state bound to the class existence
 */
const toggleClass = <E extends Element>(
	token: string,
	state: StateKeyOrFunction<boolean> = token
) => updateElement(state, {
	read: (el: E) => el.classList.contains(token),
	update: (el: E, value: boolean) => tc(el, token, value)
})

/**
 * Set a style property of an element
 * 
 * @since 0.8.0
 * @param {string} prop - name of style property to be set
 * @param {StateKeyOrFunction<string>} state - state bound to the style property value
 */
const setStyle = <E extends (HTMLElement | SVGElement | MathMLElement)>(
	prop: string,
	state: StateKeyOrFunction<string> = prop
) => updateElement(state, {
		read: (el: E) => el.style.getPropertyValue(prop),
		update: (el: E, value: string) => ss(el, prop, value) as Promise<E>,
		delete: (el: E) => rs(el, prop) as Promise<E>
	})



/* === Exported Types === */

export {
	type ElementUpdater,
	emit, updateElement,
	createElement, removeElement,
	setText, setProperty, setAttribute, toggleAttribute, toggleClass, setStyle
}
