import { type Signal, toSignal } from '@efflore/cause-effect'

import { Capsula } from './capsula'
import { log, LOG_ERROR, valueString } from './log'
import { isFunction, isPropertyKey } from './util'

/* === Types === */

type StateLike<T> = PropertyKey | Signal<T> | ((v?: T) => T)
type Factory<T> = (element: Element, index: number) => T
type FactoryOrValue<T> = T | Factory<T>
type StateLikeOrStateLikeFactory<T> = FactoryOrValue<StateLike<T>>
type EventListenerOrEventListenerFactory = FactoryOrValue<EventListenerOrEventListenerObject>

/* === Internal Functions === */

const isFactoryFunction = /*#__PURE__*/ <T>(fn: FactoryOrValue<T>): fn is Factory<T> =>
	isFunction(fn) && fn.length === 2

const fromFactory = /*#__PURE__*/ <T>(
	fn: FactoryOrValue<T>,
	element: Element,
	index: number = 0,
): T =>
	isFactoryFunction(fn) ? fn(element, index) : fn

/* === Exported Class === */

class UI<T extends Element> {
	constructor(
		public readonly host: Capsula,
		public readonly targets: T[] = [host as unknown as T]
	) {}

	on(event: string, listener: EventListenerOrEventListenerFactory): UI<T> {
		this.targets.forEach((target, index) =>
			target.addEventListener(event, fromFactory(listener, target, index))
		)
        return this
	}

	off(event: string, listener: EventListenerOrEventListenerFactory): UI<T> {
		this.targets.forEach((target, index) =>
			target.removeEventListener(event, fromFactory(listener, target, index))
		)
        return this
	}

	pass(states: Record<string, StateLikeOrStateLikeFactory<any>>): UI<T> {
		this.targets.forEach(async (target, index) => {
			await Capsula.registry.whenDefined(target.localName)
			target instanceof Capsula
				? Object.entries(states).forEach(([name, source]) => {
					const result = fromFactory(source, target, index)
					const value = isPropertyKey(result)
						? this.host.signals.get(result)
						: toSignal(result, true)
					value
						? target.set(name, value)
						: log(source, `Invalid source for state ${valueString(name)}`, LOG_ERROR)
				})
				: log(target, `Target is not a Capsula`, LOG_ERROR)
        })
        return this
	}

	sync(...fns: ((host: Capsula, target: T, index: number) => void)[]): UI<T> {
		this.targets.forEach((target, index) => fns.forEach(fn => fn(this.host, target, index)))
        return this
	}

}

export {
	type StateLike, type StateLikeOrStateLikeFactory, type EventListenerOrEventListenerFactory,
	UI
}