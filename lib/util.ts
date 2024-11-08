const isFunction = /*#__PURE__*/ (value: unknown): value is (...args: any[]) => any =>
    typeof value === 'function'

const isObject = /*#__PURE__*/ (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object'

const isDefinedObject = /*#__PURE__*/ (value: unknown): value is Record<string, unknown> =>
	!!value && isObject(value)

const isNumber = /*#__PURE__*/ (value: unknown): value is number =>
	typeof value === 'number'

const isString = /*#__PURE__*/ (value: unknown): value is string =>
	typeof value ==='string'

export { isFunction, isObject, isDefinedObject, isNumber, isString }