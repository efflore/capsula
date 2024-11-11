/**
 * @name Capsula
 * @version 0.9.1
 * @author Esther Brunner
 */
export {
	type Signal, type State, type Computed,
	UNSET, state, computed, effect, batch, isState, isSignal, toSignal
} from '@efflore/cause-effect'
export { type EnqueueDedupe, enqueue, animationFrame } from '@efflore/pulse'

export {
	type AttributeParser, type ValueOrAttributeParser, Capsula
} from './lib/capsula'

export { type UnknownContext, useContext } from './lib/context'
export {
	parse, asBoolean, asInteger, asNumber, asString, asEnum, asJSON
} from './lib/parse'
export {
	type ElementUpdater,
	emit, updateElement,
	createElement, removeElement,
	setText, setProperty, setAttribute, toggleAttribute, toggleClass, setStyle
} from './lib/effects'