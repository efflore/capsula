// node_modules/@efflore/cause-effect/lib/util.ts
var isFunction = (value) => typeof value === "function";
var isAsyncFunction = (value) => isFunction(value) && /^async\s+/.test(value.toString());
var isInstanceOf = (type) => (value) => value instanceof type;
var isError = /* @__PURE__ */ isInstanceOf(Error);
var isPromise = /* @__PURE__ */ isInstanceOf(Promise);

// node_modules/@efflore/cause-effect/lib/computed.ts
var TYPE_COMPUTED = "Computed";
var computed = (fn, memo) => {
  memo = memo ?? isAsyncFunction(fn);
  const watchers = new Set;
  let value;
  let error = null;
  let stale = true;
  const mark = () => {
    stale = true;
    if (memo)
      notify(watchers);
  };
  const compute = () => {
    try {
      return fn(value);
    } catch (e) {
      return isError(e) ? e : new Error(`Error during reactive computation: ${e}`);
    }
  };
  const handleOk = (v) => {
    stale = false;
    value = v;
    error = null;
  };
  const handleErr = (e) => {
    stale = true;
    error = e;
  };
  const update = (v) => isError(v) ? handleErr(v) : handleOk(v);
  const c = {
    [Symbol.toStringTag]: TYPE_COMPUTED,
    get: () => {
      subscribe(watchers);
      if (!memo || stale)
        watch(() => {
          const result = compute();
          isPromise(result) ? result.then(update).catch(handleErr) : update(result);
        }, mark);
      if (isError(error))
        throw error;
      return value;
    },
    map: (fn2) => computed(() => fn2(c.get()))
  };
  return c;
};
var isComputed = (value) => !!value && typeof value === "object" && value[Symbol.toStringTag] === TYPE_COMPUTED;

// node_modules/@efflore/cause-effect/lib/signal.ts
var active;
var batching = false;
var pending = new Set;
var isSignal = (value) => isState(value) || isComputed(value);
var subscribe = (watchers) => {
  if (active)
    watchers.add(active);
};
var notify = (watchers) => watchers.forEach((n) => batching ? pending.add(n) : n());
var watch = (fn, notify2) => {
  const prev = active;
  active = notify2;
  fn();
  active = prev;
};
var batch = (fn) => {
  batching = true;
  fn();
  batching = false;
  pending.forEach((n) => n());
  pending.clear();
};

// node_modules/@efflore/cause-effect/lib/state.ts
var UNSET = Symbol();

class State {
  value;
  watchers = new Set;
  constructor(value) {
    this.value = value;
  }
  get() {
    subscribe(this.watchers);
    return this.value;
  }
  set(value) {
    if (UNSET !== value) {
      const newValue = isFunction(value) ? value(this.value) : value;
      if (Object.is(this.value, newValue))
        return;
      this.value = newValue;
    }
    notify(this.watchers);
    if (UNSET === value)
      this.watchers.clear();
  }
  map(fn) {
    return computed(() => fn(this.get()));
  }
}
var state = (value) => new State(value);
var isState = /* @__PURE__ */ isInstanceOf(State);
// node_modules/@efflore/cause-effect/lib/effect.ts
var effect = (fn) => {
  const run = () => watch(() => {
    try {
      fn();
    } catch (error) {
      console.error(error);
    }
  }, run);
  run();
};
// node_modules/@efflore/flow-sure/lib/util.ts
var isFunction2 = (value) => typeof value === "function";
var isInstanceOf2 = (type) => (value) => value instanceof type;
var isError2 = (value) => isInstanceOf2(Error)(value);
var noOp = function() {
  return this;
};

// node_modules/@efflore/flow-sure/lib/maybe.ts
var maybe = (value) => value == null ? nil() : isMaybe(value) ? value : ok(value);
var isMaybe = (value) => isOk(value) || isNil(value);

// node_modules/@efflore/flow-sure/lib/nil.ts
class Nil {
  static instance = new Nil;
  get = () => {
    return;
  };
}
var nilProto = Nil.prototype;
nilProto.map = nilProto.chain = nilProto.filter = nilProto.guard = nilProto.catch = noOp;
nilProto.or = (fn) => maybe(fn());
nilProto.match = function(cases) {
  return isFunction2(cases.Nil) ? cases.Nil() : this;
};
var nil = () => Nil.instance;
var isNil = (value) => value === Nil.instance;

// node_modules/@efflore/flow-sure/lib/ok.ts
class Ok {
  value;
  constructor(value) {
    this.value = value;
  }
  get() {
    return this.value;
  }
}
var okProto = Ok.prototype;
okProto.map = function(fn) {
  return new Ok(fn(this.value));
};
okProto.chain = function(fn) {
  return fn(this.value);
};
okProto.filter = okProto.guard = function(fn) {
  return fn(this.value) ? this : nil();
};
okProto.or = okProto.catch = noOp;
okProto.match = function(cases) {
  return isFunction2(cases.Ok) ? cases.Ok(this.value) : this;
};
var ok = (value) => new Ok(value);
var isOk = /* @__PURE__ */ isInstanceOf2(Ok);
// node_modules/@efflore/flow-sure/lib/err.ts
class Err {
  error;
  constructor(error) {
    this.error = error;
  }
  get() {
    throw this.error;
  }
}
var errProto = Err.prototype;
errProto.map = errProto.chain = noOp;
errProto.filter = errProto.guard = () => nil();
errProto.or = (fn) => maybe(fn());
errProto.catch = function(fn) {
  return fn(this.error);
};
errProto.match = function(cases) {
  return isFunction2(cases.Err) ? cases.Err(this.error) : this;
};
var err = (error) => new Err(isError2(error) ? error : new Error(String(error)));
var isErr = /* @__PURE__ */ isInstanceOf2(Err);
// node_modules/@efflore/flow-sure/lib/result.ts
var result = (fn, ...args) => {
  try {
    return toResult(fn(...args));
  } catch (error) {
    return err(error);
  }
};
var asyncResult = async (fn, ...args) => {
  try {
    return toResult(await fn(...args));
  } catch (error) {
    return err(error);
  }
};
var flow = async (...fns) => {
  let res = isFunction2(fns[0]) ? nil() : toResult(fns.shift());
  for (const fn of fns) {
    if (isErr(res))
      break;
    if (!isFunction2(fn))
      return err(new TypeError("Expected a function in flow"));
    res = /^async\s+/.test(fn.toString()) ? await asyncResult(async () => fn(res.get())) : result(fn, res.get());
  }
  return res;
};
var isResult = (value) => isOk(value) || isNil(value) || isErr(value);
var toResult = (value) => value == null ? nil() : isResult(value) ? value : isError2(value) ? err(value) : ok(value);
var fromResult = (value) => isErr(value) ? value.error : isOk(value) || isNil(value) ? value.get() : value;
// lib/util.ts
var isFunction3 = (value) => typeof value === "function";
var isDefinedObject = (value) => !!value && typeof value === "object";
var isNumber = (value) => typeof value === "number";
var isString = (value) => typeof value === "string";
var isSymbol = (value) => typeof value === "symbol";
var isPropertyKey = (value) => isString(value) || isSymbol(value) || isNumber(value);

// lib/log.ts
var LOG_DEBUG = "debug";
var LOG_ERROR = "error";
var idString = (id) => id ? `#${id}` : "";
var classString = (classList) => classList.length ? `.${Array.from(classList).join(".")}` : "";
var elementName = (el) => `<${el.localName}${idString(el.id)}${classString(el.classList)}>`;
var valueString = (value) => isString(value) ? `"${value}"` : isDefinedObject(value) ? JSON.stringify(value) : String(value);
var log = (value, msg, level = LOG_DEBUG) => {
  if (true)
    console[level](msg, value);
  return value;
};

// lib/ui.ts
var fromStateLike = (host, source) => {
  return isPropertyKey(source) ? host.signals.get(source) : isSignal(source) ? source : isFunction3(source) ? computed(source.bind(host), true) : undefined;
};

class UI {
  host;
  targets;
  constructor(host, targets = [host]) {
    this.host = host;
    this.targets = targets;
  }
  on(event, listener) {
    this.targets.forEach((target) => target.addEventListener(event, listener));
    return this;
  }
  off(event, listener) {
    this.targets.forEach((target) => target.removeEventListener(event, listener));
    return this;
  }
  pass(states) {
    this.targets.forEach(async (target) => {
      await Capsula.registry.whenDefined(target.localName);
      if (target instanceof Capsula) {
        Object.entries(states).forEach(([name, source]) => {
          const value = fromStateLike(this.host, source);
          if (value)
            target.set(name, value);
          else
            log(source, `Invalid source for state ${valueString(name)}`, LOG_ERROR);
        });
      } else
        log(target, `Target is not a Capsula`, LOG_ERROR);
    });
    return this;
  }
  sync(...fns) {
    this.targets.forEach((target, index) => fns.forEach((fn) => fn(this.host, target, index)));
    return this;
  }
}

// lib/parse.ts
var parse = (host, name, value, old = undefined) => {
  const parser = host.constructor.states[name];
  return isFunction3(parser) && !!parser.length ? parser(value, host, old) : value;
};
var asBoolean = (value) => value != null;
var asInteger = (value) => maybe(value).map(parseInt).filter(Number.isFinite).get();
var asNumber = (value) => maybe(value).map(parseFloat).filter(Number.isFinite).get();
var asString = (value) => value;
var asEnum = (valid) => (value) => maybe(value).filter((v) => valid.includes(v.toLowerCase())).get();
var asJSON = (value) => result(() => value ? JSON.parse(value) : null).match({
  Err: (error) => {
    log(error, "Failed to parse JSON", LOG_ERROR);
    return;
  }
}).get();

// lib/context.ts
var CONTEXT_REQUEST = "context-request";

class ContextRequestEvent extends Event {
  context;
  callback;
  subscribe2;
  constructor(context, callback, subscribe2 = false) {
    super(CONTEXT_REQUEST, {
      bubbles: true,
      composed: true
    });
    this.context = context;
    this.callback = callback;
    this.subscribe = subscribe2;
  }
}
var useContext = (host) => {
  const proto = host.constructor;
  const consumed = proto.consumedContexts || [];
  setTimeout(() => {
    for (const context of consumed)
      host.dispatchEvent(new ContextRequestEvent(context, (value) => host.set(String(context), value)));
  });
  const provided = proto.providedContexts || [];
  if (!provided.length)
    return false;
  host.addEventListener(CONTEXT_REQUEST, (e) => {
    const { context, callback } = e;
    if (!provided.includes(context) || !isFunction3(callback))
      return;
    e.stopPropagation();
    callback(host.signals.get(String(context)));
  });
  return true;
};

// lib/capsula.ts
class Capsula extends HTMLElement {
  static registry = customElements;
  static states = {};
  static observedAttributes;
  static consumedContexts;
  static providedContexts;
  static define(tag) {
    result(() => Capsula.registry.define(tag, this)).match({
      Err: (error) => log(tag, error.message, LOG_ERROR),
      Ok: () => log(tag, "Registered custom element")
    });
  }
  signals = new Map;
  self = new UI(this);
  root = this.shadowRoot || this;
  debug = false;
  attributeChangedCallback(name, old, value) {
    if (value === old)
      return;
    if (this.debug)
      log(`${valueString(old)} => ${valueString(value)}`, `Attribute "${name}" of ${elementName(this)} changed`);
    this.set(name, parse(this, name, value, old));
  }
  connectedCallback() {
    if (true) {
      this.debug = this.hasAttribute("debug");
      if (this.debug)
        log(this, "Connected");
    }
    Object.entries(this.constructor.states).forEach(([name, source]) => {
      const value = isFunction3(source) ? parse(this, name, this.getAttribute(name) ?? undefined, undefined) : source;
      this.set(name, value, false);
    });
    useContext(this);
  }
  disconnectedCallback() {
    if (this.debug)
      log(this, "Disconnected");
  }
  adoptedCallback() {
    if (this.debug)
      log(this, "Adopted");
  }
  has(key) {
    return this.signals.has(key);
  }
  get(key) {
    const unwrap = (v) => !isDefinedObject(v) ? v : isFunction3(v) ? unwrap(v()) : isSignal(v) || isResult(v) ? unwrap(v.get()) : v;
    const value = unwrap(this.signals.get(key));
    if (this.debug)
      log(value, `Get current value of state ${valueString(key)} in ${elementName(this)}`);
    return value;
  }
  set(key, value, update = true) {
    let op;
    if (!this.signals.has(key)) {
      op = "Create";
      this.signals.set(key, isSignal(value) ? value : isFunction3(value) ? computed(value, true) : state(value));
    } else if (!update) {
      return;
    } else {
      const s = this.signals.get(key);
      if (isSignal(value)) {
        op = "Replace";
        this.signals.set(key, value);
        if (isState(s))
          s.set(UNSET);
      } else {
        if (isState(s)) {
          op = "Update";
          s.set(value);
        } else {
          log(value, `Computed state ${valueString(key)} in ${elementName(this)} cannot be set`, LOG_ERROR);
          return;
        }
      }
    }
    if (this.debug)
      log(value, `${op} state ${valueString(key)} in ${elementName(this)}`);
  }
  delete(key) {
    if (this.debug)
      log(key, `Delete state ${valueString(key)} from ${elementName(this)}`);
    return this.signals.delete(key);
  }
  first(selector) {
    const element = this.root.querySelector(selector);
    return new UI(this, element ? [element] : []);
  }
  all(selector) {
    return new UI(this, Array.from(this.root.querySelectorAll(selector)));
  }
}
// node_modules/@efflore/pulse/lib/pulse.ts
if (!("requestAnimationFrame" in globalThis))
  globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 16);
var dedupeMap = new Map;
var queue = [];
var requestId;
var flush = () => {
  requestId = null;
  queue.forEach((fn) => fn());
  queue = [];
  dedupeMap.clear();
};
var requestTick = () => {
  if (requestId)
    cancelAnimationFrame(requestId);
  requestId = requestAnimationFrame(flush);
};
queueMicrotask(flush);
var enqueue = (callback, dedupe) => new Promise((resolve, reject) => {
  const wrappedCallback = () => {
    try {
      resolve(callback());
    } catch (error) {
      reject(error);
    }
  };
  if (dedupe) {
    const [el, op] = dedupe;
    if (!dedupeMap.has(el))
      dedupeMap.set(el, new Map);
    const elementMap = dedupeMap.get(el);
    if (elementMap.has(op)) {
      const idx = queue.indexOf(callback);
      if (idx > -1)
        queue.splice(idx, 1);
    }
    elementMap.set(op, wrappedCallback);
  }
  queue.push(wrappedCallback);
  requestTick();
});
var animationFrame = async () => new Promise(requestAnimationFrame);
// node_modules/@efflore/pulse/lib/util.ts
var isComment = (node) => node.nodeType === Node.COMMENT_NODE;
var isSafeAttribute = (attr) => !/^on/i.test(attr);
var isSafeURL = (value) => {
  if (/^(mailto|tel):/i.test(value))
    return true;
  if (value.includes("://")) {
    try {
      const url = new URL(value, window.location.origin);
      return !["http:", "https:", "ftp:"].includes(url.protocol);
    } catch (error) {
      return true;
    }
  }
  return true;
};
var safeSetAttribute = (element, attr, value) => {
  if (!isSafeAttribute(attr))
    throw new Error(`Unsafe attribute: ${attr}`);
  value = String(value).trim();
  if (!isSafeURL(value))
    throw new Error(`Unsafe URL for ${attr}: ${value}`);
  element.setAttribute(attr, value);
};

// node_modules/@efflore/pulse/lib/update.ts
var ce = (parent, tag, attributes = {}, text) => enqueue(() => {
  const child = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes))
    safeSetAttribute(child, key, value);
  if (text)
    child.textContent = text;
  parent.append(child);
  return child;
}, [parent, "e"]);
var re = (element) => enqueue(() => {
  element.remove();
  return null;
}, [element, "r"]);
var st = (element, text) => enqueue(() => {
  Array.from(element.childNodes).filter((node) => !isComment(node)).forEach((node) => node.remove());
  element.append(document.createTextNode(text));
  return element;
}, [element, "t"]);
var sa = (element, attribute, value) => enqueue(() => {
  safeSetAttribute(element, attribute, value);
  return element;
}, [element, `a:${attribute}`]);
var ra = (element, attribute) => enqueue(() => {
  element.removeAttribute(attribute);
  return element;
}, [element, `a:${attribute}`]);
var ta = (element, attribute, value) => enqueue(() => {
  element.toggleAttribute(attribute, value);
  return element;
}, [element, `a:${attribute}`]);
var tc = (element, token, value) => enqueue(() => {
  element.classList.toggle(token, value);
  return element;
}, [element, `c:${token}`]);
var ss = (element, property, value) => enqueue(() => {
  element.style.setProperty(property, value);
  return element;
}, [element, `s:${property}`]);
var rs = (element, property) => enqueue(() => {
  element.style.removeProperty(property);
  return element;
}, [element, `s:${property}`]);
// lib/effects.ts
var emit = (event, state2 = event) => (host, target) => effect(() => {
  target.dispatchEvent(new CustomEvent(event, {
    detail: host.get(state2),
    bubbles: true
  }));
});
var updateElement = (state2, updater) => (host, target) => {
  const { read, update: update2 } = updater;
  const fallback = read(target);
  if (!isFunction3(state2)) {
    const value = isString(state2) && isString(fallback) ? parse(host, state2, fallback) : fallback;
    host.set(state2, value, false);
  }
  effect(() => {
    const current = read(target);
    const value = isFunction3(state2) ? state2(current) : host.get(state2);
    if (!Object.is(value, current)) {
      if (value === null && updater.delete)
        updater.delete(target);
      else if (value == null && fallback)
        update2(target, fallback);
      else if (value != null)
        update2(target, value);
    }
  });
};
var createElement = (tag, state2) => updateElement(state2, {
  read: () => null,
  update: (el, value) => ce(el, tag, value)
});
var removeElement = (state2) => updateElement(state2, {
  read: (el) => el != null,
  update: (el, value) => value ? re(el) : Promise.resolve(null)
});
var setText = (state2) => updateElement(state2, {
  read: (el) => el.textContent,
  update: (el, value) => st(el, value)
});
var setProperty = (key, state2 = key) => updateElement(state2, {
  read: (el) => el[key],
  update: (el, value) => el[key] = value
});
var setAttribute = (name, state2 = name) => updateElement(state2, {
  read: (el) => el.getAttribute(name),
  update: (el, value) => sa(el, name, value),
  delete: (el) => ra(el, name)
});
var toggleAttribute = (name, state2 = name) => updateElement(state2, {
  read: (el) => el.hasAttribute(name),
  update: (el, value) => ta(el, name, value)
});
var toggleClass = (token, state2 = token) => updateElement(state2, {
  read: (el) => el.classList.contains(token),
  update: (el, value) => tc(el, token, value)
});
var setStyle = (prop, state2 = prop) => updateElement(state2, {
  read: (el) => el.style.getPropertyValue(prop),
  update: (el, value) => ss(el, prop, value),
  delete: (el) => rs(el, prop)
});
export {
  useContext,
  updateElement,
  toggleClass,
  toggleAttribute,
  toResult,
  state,
  setText,
  setStyle,
  setProperty,
  setAttribute,
  result,
  removeElement,
  parse,
  ok,
  nil,
  maybe,
  isState,
  isSignal,
  isResult,
  isOk,
  isNil,
  isMaybe,
  isErr,
  isComputed,
  fromResult,
  flow,
  err,
  enqueue,
  emit,
  effect,
  createElement,
  computed,
  batch,
  asyncResult,
  asString,
  asNumber,
  asJSON,
  asInteger,
  asEnum,
  asBoolean,
  animationFrame,
  UNSET,
  State,
  Ok,
  Nil,
  Err,
  Capsula
};
