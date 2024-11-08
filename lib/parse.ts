import { type Maybe } from '@efflore/flow-sure'

import { isFunction } from './util'
import type { Capsula } from '../index'

/* === Types === */

type AttributeParser<T> = (
	element: Capsula,
	value: string | undefined,
	old: string | undefined
) => Maybe<T>

type AttributeMap = Record<string, AttributeParser<unknown>>

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
 */
const parse = (
	host: Capsula,
	name: string,
	value: string | undefined,
	old: string | undefined = undefined
) => {
	const parser = (host.constructor as typeof Capsula).states[name]
	return isAttributeParser(parser) ? parser(host, value, old) : value
}

export { type AttributeParser, type AttributeMap, parse }