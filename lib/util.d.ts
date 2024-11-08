declare const isFunction: (value: unknown) => value is (...args: any[]) => any;
declare const isObject: (value: unknown) => value is Record<string, unknown>;
declare const isDefinedObject: (value: unknown) => value is Record<string, unknown>;
declare const isNumber: (value: unknown) => value is number;
declare const isString: (value: unknown) => value is string;
export { isFunction, isObject, isDefinedObject, isNumber, isString };
