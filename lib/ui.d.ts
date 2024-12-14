import { type Signal } from '@efflore/cause-effect';
import { Capsula } from './capsula';
type StateLike<T> = PropertyKey | Signal<T> | ((v?: T) => T);
type Factory<T> = (element: Element, index: number) => T;
type FactoryOrValue<T> = T | Factory<T>;
type StateLikeOrStateLikeFactory<T> = FactoryOrValue<StateLike<T>>;
type EventListenerOrEventListenerFactory = FactoryOrValue<EventListenerOrEventListenerObject>;
declare class UI<T extends Element> {
    readonly host: Capsula;
    readonly targets: T[];
    constructor(host: Capsula, targets?: T[]);
    on(event: string, listener: EventListenerOrEventListenerFactory): UI<T>;
    off(event: string, listener: EventListenerOrEventListenerFactory): UI<T>;
    pass(states: Record<string, StateLikeOrStateLikeFactory<any>>): UI<T>;
    sync(...fns: ((host: Capsula, target: T, index: number) => void)[]): UI<T>;
}
export { type StateLike, type StateLikeOrStateLikeFactory, type EventListenerOrEventListenerFactory, UI };
