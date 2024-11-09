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
		: isFunction(source) &&!source.length ? computed(source)
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

	pass(states: Record<string, StateLike<T>>): UI<T> {
		this.targets.forEach(target => {
			if (target instanceof Capsula) {
				(this.host.constructor as typeof Capsula).registry
					.whenDefined(target.tagName)
					.then(() => {
						Object.entries(states).forEach(([name, source]) => {
							const value = fromStateLike(this.host, source)
							if (value)
								target.set(name, value)
                            else
								log(source, `Invalid source for state ${valueString(name)}`, LOG_ERROR)
                        })
					})
			} else {
				log(target, 'Target is not a Capsula instance', LOG_ERROR)
			}
        })
        return this
	}

	sync(...fns: ((host: Capsula, target: T) => void)[]): UI<T> {
		this.targets.forEach(target => fns.forEach(fn => fn(this.host, target)))
        return this
	}

}

export { UI }