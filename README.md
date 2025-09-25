# 🏕️ twine-campfire

A cozy story format for Twine.

Explore the [Storybook documentation](https://magicink.github.io/twine-campfire) for interactive examples of each component.

## Installation

1. Copy this link URL: [https://github.com/magicink/twine-campfire/releases/latest/download/format.js](https://github.com/magicink/twine-campfire/releases/latest/download/format.js).
2. Start Twine and navigate to **Twine > Story Formats**.
3. Click **Add**, paste the copied URL into the form, then confirm.
4. To activate the format, open a story and choose **campfire 1.x.x** from the **Story Format** dropdown in **Story > Details**.

## Directives

Campfire extends Markdown with
[remark-directive](https://github.com/remarkjs/remark-directive) syntax.
Directives begin with a colon and let passages interact with the game state.
They come in leaf, text, or container form, each serving a different role.

- **Leaf** – `::name[LABEL]{attr=value}` — a standalone directive that performs an action or emits markup without wrapping other content.
- **Text** – `:name[LABEL]{attr=value}` — an inline directive used inside paragraphs to inject values or generate small spans of text.
- **Container** – a block directive that wraps content between `:::name{attr=value}` and a closing `:::` marker.

  ```md
  :::name{attr=value}
  CONTENT
  :::
  ```

Directives are grouped by purpose.

### Example

Here's a practical example showing how directives can be combined to create interactive content:

```md
::createRange[testRange=0]{min=0 max=10}

The value is currently :show[testRange]

:::trigger{label="add"}
::setRange[testRange=(testRange.value+1)]
:::

:::if[testRange.value === testRange.max]

[[Next Page->Next]]

:::
```

This example creates a numeric range with a minimum of 0 and maximum of 10, displays the current value, provides a button to increment the value, and shows a link to the next passage when the maximum value is reached.

See the dedicated docs for detailed usage:

- [Variables, ranges & arrays](docs/directives/variables-and-state.md)
- [Data retrieval & evaluation](docs/directives/data-retrieval.md)
- [Conditional logic & iteration](docs/directives/conditional-logic-and-iteration.md)
- [Inputs and events](docs/directives/inputs-and-events.md)
- [Navigation, composition & transitions](docs/directives/navigation-composition.md)
- [Asset management](docs/directives/asset-management.md)
- [Persistence](docs/directives/persistence.md)
- [Localization & internationalization](docs/directives/localization.md)

Campfire prints descriptive error messages to the browser console when it encounters invalid markup.

## Twine links

Campfire recognizes Twine's `[[Link]]` syntax. The text inside becomes a
button that jumps to the target passage. Use an arrow to specify a different
target.

```md
[[DISPLAY TEXT->PASSAGE NAME]]
```

## Markdown formatting

Campfire accepts standard Markdown and extras from
[remark-gfm](https://github.com/remarkjs/remark-gfm). This includes tables,
strikethrough, task lists, autolinks and more.

Examples:

- **Table**

  Precede and separate columns with `|`.

  ```md
  | NAME  | HP  |
  | ----- | --- |
  | ALICE | 10  |
  | BOB   | 8   |
  ```

- **Strikethrough**

  ```md
  ~~THIS TEXT IS CROSSED OUT~~
  ```

- **Task list**

  ```md
  - [x] FIND THE KEY
  - [ ] OPEN THE DOOR
  ```

- **Autolink**

  ```md
  <https://twine-campfire.dev>
  ```

For more on internal classes and default styling, see [Styling elements](docs/styling-elements.md).

## Further reading

- [Twine documentation](https://twinery.org/)
- [Campfire Storybuilder VS Code extension](projects/campfire-vscode-extension/README.md)
- [Twee 3 Storybuilder VS Code extension](projects/twee3-vscode-extension/README.md)
- [remark-directive](https://github.com/remarkjs/remark-directive)
- [i18next](https://www.i18next.com/)

## AI Disclosure

See [AI disclosure](docs/ai-disclosure.md).
