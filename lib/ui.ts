import { maybe, ok } from '@efflore/flow-sure'

import type { Capsula } from '../index'
import { isDefinedObject } from './util'

/* === Types === */

type UI<T> = {
	readonly [Symbol.toStringTag]: string
	host: Capsula
    target: T
}

/* === Constants === */

const TYPE_UI = 'UI'

/* === Exported Functions === */

const ui = (host: Capsula, target: Element = host) => ({
	[Symbol.toStringTag]: TYPE_UI,
	host,
	target
})

const isUI = (value: unknown): value is UI<unknown> =>
	isDefinedObject(value)
		&& (value as { [key in typeof Symbol.toStringTag]: string })[Symbol.toStringTag] === TYPE_UI

const first = (host: Capsula) => (selector: string) => 
	maybe(host.root.querySelector(selector))
		.map<UI<Element>>((target: Element) => ui(host, target))

const all = (host: Capsula) => (selector: string) =>
	Array.from(host.root.querySelectorAll(selector)).map(target => ui(host, target))

export { type UI, TYPE_UI, ui, isUI, first, all }