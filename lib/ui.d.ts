import { type Signal } from '@efflore/cause-effect';
import { Capsula } from './capsula';
type StateLike<T> = PropertyKey | Signal<T> | (() => T);
declare class UI<T extends Element> {
    readonly host: Capsula;
    readonly targets: T[];
    constructor(host: Capsula, targets?: T[]);
    on(event: string, listener: EventListenerOrEventListenerObject): UI<T>;
    off(event: string, listener: EventListenerOrEventListenerObject): UI<T>;
    pass(states: Record<string, StateLike<T>>): UI<T>;
    sync(...fns: ((host: Capsula, target: T) => void)[]): UI<T>;
}
export { UI };
