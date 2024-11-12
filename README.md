# Capsula

Version 0.9.2

**Capsula** - transform reusable markup, styles and behavior into powerful, reactive, and maintainable Web Components.

`Capsula` is a base class for Web Components with reactive states and UI effects. Capsula is tiny, around 3kB gzipped JS code, of which unused functions can be tree-shaken by build tools. It uses [Cause & Effect](https://github.com/efflore/cause-effect) internally for state management with signals and [Pulse](https://github.com/efflore/pulse) for scheduled DOM updates.

## Key Features

* **Reusable Components**: Create highly modular and reusable components to encapsulate styles and behavior.
* **Declarative States**: Bring static, server-rendered content to life with dynamic interactivity and state management.
* **Signal-Based Reactivity**: Employ signals for efficient state propagation, ensuring your components react instantly to changes.
* **Declarative Effects**: Use granular effects to automatically synchronize UI states with minimal code.
* **Context Support**: Share global states across your component tree without tightly coupling logic.

## Installation

```bash
# with npm
npm install @efflore/capsula

# or with bun
bun add @efflore/capsula
```

For the functional core of your application we recommend [FlowSure](https://github.com/efflore/flow-sure) to create a robust and expressive data flow, supporting error handling and async processing with Result monads.

## Basic Usage

### Show Appreciation

Server-rendered markup:

```html
<show-appreciation aria-label="Appreciation" count="5">
    <button type="button">
        <span class="emoji">💐</span>
        <span class="count">5</span>
    </button>
</show-appreciation>
```

Capsula component:

```js
import { Capsula, asInteger, setText } from '@efflore/capsula'

class ShowAppreciation extends Capsula {
    static observedAttributes = ['count']
    static states = {
        count: asInteger
    }

    connectedCallback() {

        // Bind click event to increment count
        this.first('button').on('click', () => this.set('count', v => ++v))

        // Update .count text when count changes
        this.first('.count').sync(setText('count'))
    }
}
ShowAppreciation.define('show-appreciation')
```

Example styles:

```css
show-appreciation {
    display: inline-block;

    & button {
        display: flex;
        flex-direction: row;
        gap: var(--space-s);
        border: 1px solid var(--color-border);
        border-radius: var(--space-xs);
        background-color: var(--color-secondary);
        color: var(--color-text);
        padding: var(--space-xs) var(--space-s);
        cursor: pointer;
        font-size: var(--font-size-m);
        line-height: var(--line-height-xs);
        transition: transform var(--transition-short) var(--easing-inout);

        &:hover {
            background-color: var(--color-secondary-hover);
        }

        &:active {
            background-color: var(--color-secondary-active);

            .emoji {
                transform: scale(1.1);
            }
        }
    }
}
```

### Lazy Load

A more complex component demonstrating async fetch from the server:

```html
<lazy-load src="/lazy-load/snippet.html">
    <div class="loading">Loading...</div>
    <div class="error"></div>
</lazy-load>
```

```js
import { Capsula, setText, setProperty, effect, enqueue } from '@efflore/capsula'

class LazyLoad extends Capsula {
    static observedAttributes = ['src']
    static states = {
        src: v => {
                let url = ''
                try {
                    url = new URL(v, location.href) // ensure 'src' attribute is a valid URL
                    if (url.origin !== location.origin) // sanity check for cross-origin URLs
                        throw new TypeError('Invalid URL origin')
                } catch (error) {
                    console.error(error, url)
                    url = ''
                }
                return url.toString()
            },
        error: ''
    }

    connectedCallback() {

        // Show / hide loading message
        this.first('.loading')
            .sync(setProperty('ariaHidden', () => !!this.get('error')))

        // Set and show / hide error message
        this.first('.error')
            .sync(setText('error'))
            .sync(setProperty('ariaHidden', () => !this.get('error')))

        // Load content from provided URL
        effect(async () => {
            const src = this.get('src')
            if (!src) return // silently fail if no valid URL is provided
            try {
                const response = await fetch(src)
                if (response.ok) {
                    const content = await response.text()
                    enqueue(() => {
                        // UNSAFE!, use only trusted sources in 'src' attribute
                        this.root.innerHTML = content
                        this.root.querySelectorAll('script').forEach(script => {
                            const newScript = document.createElement('script')
                            newScript.appendChild(document.createTextNode(script.textContent))
                            this.root.appendChild(newScript)
                            script.remove()
                        })
                    }, [this.root, 'h'])
                    this.set('error', '')
                } else {
                    this.set('error', response.status + ':'+ response.statusText)
                }
            } catch (error) {
                this.set('error', error)
            }
        })
    }
}
LazyLoad.define('lazy-load')
```