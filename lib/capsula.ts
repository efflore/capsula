import { type Computed, type Signal, State, UNSET, isSignal, isState, toSignal } from "@efflore/cause-effect"

import { isDefinedObject, isFunction } from "./util"
import { elementName, log, LOG_ERROR, valueString } from "./log"
import { UI } from "./ui"
import { parse } from "./parse"
import { type UnknownContext, useContext } from "./context"

/* === Types === */

export type AttributeParser<T> = (
	value: string | undefined,
	element: Capsula,
	old: string | undefined
) => T | undefined

export type ValueOrAttributeParser<T> = T | AttributeParser<T>

/* === Exported Class === */

/**
 * Base class for reactive custom elements
 * 
 * @class Capsula
 * @extends HTMLElement
 * @type {Capsula}
 */
export class Capsula extends HTMLElement {
	static registry: CustomElementRegistry = customElements
	static states: Record<string, ValueOrAttributeParser<any>> = {}
	static observedAttributes: string[]
	static consumedContexts: UnknownContext[]
	static providedContexts: UnknownContext[]

	/**
	 * Define a custom element in the custom element registry
	 * 
	 * @since 0.5.0
	 * @param {string} tag - name of the custom element
	 */
	static define(tag: string): void {
		try {
			Capsula.registry.define(tag, this)
			Bun.env.DEV_MODE && log(tag, 'Registered custom element')
		} catch (error) {
			log(error, `Failed to register custom element ${tag}`, LOG_ERROR)
		}
	}

	/**
	 * @since 0.9.0
	 * @property {Map<PropertyKey, Signal<any>>} signals - map of observable properties
	 */
	signals = new Map<PropertyKey, Signal<any>>()

	/**
	 * @since 0.9.0
	 * @property {ElementInternals | undefined} internals - native internal properties of the custom element
	 * /
	internals: ElementInternals | undefined

	/**
	 * @since 0.8.1
	 * @property {UI<Capsula>} self - UI object for this element
	 */
	self: UI<Capsula> = new UI(this)

	/**
	 * @since 0.8.3
	 */
	root: Element | ShadowRoot = this.shadowRoot || this

	/**
	 * @since 0.9.0
	 */
	debug: boolean = false

	/**
	 * Native callback function when an observed attribute of the custom element changes
	 * 
	 * @since 0.1.0
	 * @param {string} name - name of the modified attribute
	 * @param {string | undefined} old - old value of the modified attribute
	 * @param {string | undefined} value - new value of the modified attribute
	 */
	attributeChangedCallback(
		name: string,
		old: string | undefined,
		value: string | undefined): void
	{
		if (value === old) return
		if (Bun.env.DEV_MODE && this.debug)
			log(`${valueString(old)} => ${valueString(value)}`, `Attribute "${name}" of ${elementName(this)} changed`)
		this.set(name, parse(this, name, value, old))
	}

	/**
     * Native callback function when the custom element is first connected to the document
	 * 
	 * Used for context providers and consumers
	 * If your component uses context, you must call `super.connectedCallback()`
     * 
     * @since 0.7.0
     */
	connectedCallback(): void {
		if (Bun.env.DEV_MODE) {
			this.debug = this.hasAttribute('debug')
			if (this.debug) log(this, 'Connected')
		}
		Object.entries((this.constructor as typeof Capsula).states)
			.forEach(([name, source]) => {
				const value = isFunction(source)
					? parse(this, name, this.getAttribute(name) ?? undefined, undefined)
					: source
				this.set(name, value, false)
			})
		useContext(this)
	}

	disconnectedCallback(): void {
		if (Bun.env.DEV_MODE && this.debug)
			log(this, 'Disconnected')
	}

	adoptedCallback(): void {
		if (Bun.env.DEV_MODE && this.debug)
			log(this, 'Adopted')
    }

	/**
	 * Check whether a state is set
	 * 
	 * @since 0.2.0
	 * @param {any} key - state to be checked
	 * @returns {boolean} `true` if this element has state with the given key; `false` otherwise
	 */
	has(key: any): boolean {
		return this.signals.has(key)
	}

	/**
	 * Get the current value of a state
	 *
	 * @since 0.2.0
	 * @param {any} key - state to get value from
	 * @returns {T | undefined} current value of state; undefined if state does not exist
	 */
	get<T>(key: any): T | undefined {
		const unwrap = (v: any): any =>
			!isDefinedObject(v) ? v // shortcut for non-object values
				: isFunction(v) ? unwrap(v())
				: isSignal(v) ? unwrap(v.get())
				: v
		const value = unwrap(this.signals.get(key))
		if (Bun.env.DEV_MODE && this.debug)
			log(value, `Get current value of state ${valueString(key)} in ${elementName(this)}`)
		return value
	}

	/**
	 * Create a state or update its value and return its current value
	 * 
	 * @since 0.2.0
	 * @param {any} key - state to set value to
	 * @param {T | ((old?: T) => T) | Signal<T>} value - initial or new value; may be a function (gets old value as parameter) to be evaluated when value is retrieved
	 * @param {boolean} [update=true] - if `true` (default), the state is updated; if `false`, do nothing if state already exists
	 */
	set<T>(
		key: any,
		value: T | Signal<T> | ((old?: T) => T),
		update: boolean = true
	): void {
		let op: string;

		// State does not exist => create new state
		if (!this.signals.has(key)) {
			if (Bun.env.DEV_MODE && this.debug) op = 'Create'
			this.signals.set(key, toSignal(value as State<T> | Computed<T> | T, true))


		// State already exists => update existing state
		} else if (update) {
			const s = this.signals.get(key)

			// Value is a Signal => replace state with new signal
			if (isSignal(value)) {
				if (Bun.env.DEV_MODE && this.debug) op = 'Replace'
				this.signals.set(key, value)
				if (isState(s)) s.set(UNSET) // clear previous state so watchers re-subscribe to new signal

			// Value is not a Signal => set existing state to new value
			} else {
				if (isState(s)) {
					if (Bun.env.DEV_MODE && this.debug) op = 'Update'
					s.set(value)
				} else {
					log(value, `Computed state ${valueString(key)} in ${elementName(this)} cannot be set`, LOG_ERROR)
					return
				}
			}

		// Do nothing if state already exists and update is false
		} else return

		if (Bun.env.DEV_MODE && this.debug)
			log(value, `${op!} state ${valueString(key)} in ${elementName(this)}`)

	}

	/**
	 * Delete a state, also removing all effects dependent on the state
	 * 
	 * @since 0.4.0
	 * @param {any} key - state to be deleted
	 * @returns {boolean} `true` if the state existed and was deleted; `false` if ignored
	 */
	delete(key: any): boolean {
		if (Bun.env.DEV_MODE && this.debug) log(
			key,
			`Delete state ${valueString(key)} from ${elementName(this)}`
		)
		return this.signals.delete(key)
	}

	/**
	 * Get array of first sub-element matching a given selector within the custom element
	 * 
	 * @since 0.8.1
	 * @param {string} selector - selector to match sub-element
	 * @returns {UI<Element>[]} - array of zero or one UI objects of matching sub-element
	 */
	first(selector: string): UI<Element> {
		const element = this.root.querySelector(selector)
		return new UI(this, element ? [element] : [])
	}
	/**
	 * Get array of all sub-elements matching a given selector within the custom element
	 * 
	 * @since 0.8.1
	 * @param {string} selector - selector to match sub-elements
	 * @returns {UI<Element>} - array of UI object of matching sub-elements
	 */
	all(selector: string): UI<Element> {
		return new UI(this, Array.from(this.root.querySelectorAll(selector)))
	}

}