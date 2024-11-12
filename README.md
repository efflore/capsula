# Capsula

Version 0.9.2

**Capsula** - transform reusable markup, styles and behavior into powerful, reactive, and maintainable Web Components.

`Capsula` is a base class for Web Components with reactive states and UI effects.

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

## Basic Usage

### Simple Component

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