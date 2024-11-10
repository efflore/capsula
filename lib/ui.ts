import { type Signal, isSignal, computed } from '@efflore/cause-effect'

import { Capsula } from './capsula'
import { log, LOG_ERROR, valueString } from './log'
import { isFunction, isPropertyKey } from './util'

/* === Types === */

type StateLike<T> = PropertyKey | Signal<T> | (() => T)

/* === Exported Functions === */

const fromStateLike = <T>(host: Capsula, source: StateLike<T>): Signal<T> | undefined => {
	return isPropertyKey(source) ? host.signals.get(source)
	    : isSignal(source) ? source
		: isFunction(source) ? computed(source.bind(host), true)
		: undefined
}

/* === Exported Class === */

class UI<T extends Element> {
	constructor(
		public readonly host: Capsula,
		public readonly targets: T[] = [host as unknown as T]
	) {}

	on(event: string, listener: EventListenerOrEventListenerObject): UI<T> {
		this.targets.forEach(target => target.addEventListener(event, listener))
        return this
	}

	off(event: string, listener: EventListenerOrEventListenerObject): UI<T> {
		this.targets.forEach(target => target.removeEventListener(event, listener))
        return this
	}

	pass(states: Record<string, StateLike<any>>): UI<T> {
		this.targets.forEach(async target => {
			await Capsula.registry.whenDefined(target.localName)
			if (target instanceof Capsula) {
				Object.entries(states).forEach(([name, source]) => {
					const value = fromStateLike(this.host, source)
					if (value)
						target.set(name, value)
					else
						log(source, `Invalid source for state ${valueString(name)}`, LOG_ERROR)
				})
			} else log(target, `Target is not a Capsula`, LOG_ERROR)
        })
        return this
	}

	sync(...fns: ((host: Capsula, target: T, index: number) => void)[]): UI<T> {
		this.targets.forEach((target, index) => fns.forEach(fn => fn(this.host, target, index)))
        return this
	}

}

export { UI }