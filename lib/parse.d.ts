import { type Maybe } from '@efflore/flow-sure';
import type { Capsula } from '../index';
type AttributeParser<T> = (element: Capsula, value: string | undefined, old: string | undefined) => Maybe<T>;
type AttributeMap = Record<string, AttributeParser<unknown>>;
/**
 * Parse according to static attributeMap
 *
 * @since 0.8.4
 * @param {Capsula} host - host Capsula
 * @param {string} name - attribute name
 * @param {string} value - attribute value
 * @param {string | undefined} [old=undefined] - old attribute value
 */
declare const parse: (host: Capsula, name: string, value: string | undefined, old?: string | undefined) => string | Maybe<any> | undefined;
export { type AttributeParser, type AttributeMap, parse };
