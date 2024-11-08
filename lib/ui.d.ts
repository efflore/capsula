import type { Capsula } from '../index';
type UI<T> = {
    readonly [Symbol.toStringTag]: string;
    host: Capsula;
    target: T;
};
declare const TYPE_UI = "UI";
declare const ui: (host: Capsula, target?: Element) => {
    [Symbol.toStringTag]: string;
    host: Capsula;
    target: Element;
};
declare const isUI: (value: unknown) => value is UI<unknown>;
declare const first: (host: Capsula) => (selector: string) => import("@efflore/flow-sure").Nil | import("@efflore/flow-sure").Ok<UI<Element>>;
declare const all: (host: Capsula) => (selector: string) => {
    [Symbol.toStringTag]: string;
    host: Capsula;
    target: Element;
}[];
export { type UI, TYPE_UI, ui, isUI, first, all };
