import { type Maybe, maybe, result } from '@efflore/flow-sure'

import { isFunction } from './util'
import type { Capsula } from './capsula'
import { log, LOG_ERROR } from './log'

/* === Types === */

type AttributeParser<T> = (
	value: string | undefined,
	element: Capsula,
	old: string | undefined
) => Maybe<T>

/* === Internal Functions === */

const isAttributeParser = (value: unknown): value is AttributeParser<unknown> =>
	isFunction(value) && !!(value as AttributeParser<unknown>).length

/* === Exported Functions === */

/**
 * Parse according to static attributeMap
 * 
 * @since 0.8.4
 * @param {Capsula} host - host Capsula
 * @param {string} name - attribute name
 * @param {string} value - attribute value
 * @param {string | undefined} [old=undefined] - old attribute value
 * @returns {unknown}
 */
const parse = (
	host: Capsula,
	name: string,
	value: string | undefined,
	old: string | undefined = undefined
): unknown => {
	const parser = (host.constructor as typeof Capsula).states[name]
	return isAttributeParser(parser) ? parser(value, host, old) : value
}

/**
 * Parse a boolean attribute as an actual boolean value
 * 
 * @since 0.7.0
 * @param {string} value - maybe string value
 * @returns {boolean}
 */
const asBoolean = (value?: string): boolean =>
	value != null

/**
 * Parse an attribute as a number forced to integer
 * 
 * @since 0.7.0
 * @param {string} value - maybe string value
 * @returns {number | undefined}
 */
const asInteger = (value?: string): number | undefined =>
	maybe(value).map<number>(parseInt).filter(Number.isFinite).get()

/**
 * Parse an attribute as a number
 * 
 * @since 0.7.0
 * @param {string} value - maybe string value
 * @returns {number | undefined}
 */
const asNumber = (value?: string): number | undefined =>
	maybe(value).map<number>(parseFloat).filter(Number.isFinite).get()

/**
 * Parse an attribute as a string
 * 
 * @since 0.7.0
 * @param {string} value - maybe string value
 * @returns {string}
 */
const asString = (value?: string): string | undefined => value

/**
 * Parse an attribute as a tri-state value (true, false, mixed)
 * 
 * @since 0.9.0
 * @param {string[]} valid - array of valid values
 */
const asEnum = (valid: string[]) =>
	(value?: string): string | undefined =>
		maybe(value).filter(v => valid.includes(v.toLowerCase())).get()

/**
 * Parse an attribute as a JSON serialized object
 * 
 * @since 0.7.2
 * @param {string} value - maybe string value
 * @returns {unknown}
 */
const asJSON = (value?: string): unknown =>
	result(() => value ? JSON.parse(value) : null).match({
		Err: error => {
			log(error, 'Failed to parse JSON', LOG_ERROR)
			return
		}
	}).get()

export {
	type AttributeParser,
	parse, asBoolean, asInteger, asNumber, asString, asEnum, asJSON,
}