# 🏕️ twine-campfire

A cozy story format for Twine.

## Installation

1. Visit the [Twine Campfire releases page](https://github.com/magicink/twine-campfire/releases) and open the latest release.
2. Copy the URL of the `format.js` file listed under **Assets**.
3. Start Twine and navigate to **Twine > Story Formats**.
4. Click **Add**, paste the copied URL into the form, then confirm.
5. To activate the format, open a story and choose **campfire 1.x.x** from the **Story Format** dropdown in **Story > Details**.

## AI Disclosure

See [AI disclosure](docs/ai-disclosure.md).

## Twine links

Campfire recognizes Twine's `[[Link]]` syntax. The text inside becomes a
button that jumps to the target passage. Use an arrow to specify a different
target.

```md
[[DISPLAY TEXT->PASSAGE NAME]]
```

> To style the button, update the `.campfire-link` class in your CSS.

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

## Directives

Campfire extends Markdown with
[remark-directive](https://github.com/remarkjs/remark-directive) syntax.
Directives begin with a colon and let passages interact with the game state.
They come in leaf or container form.

- **Leaf/Text** – `:name[LABEL]{attr=value}`
- **Container** –

  ```md
  :::name{attr=value}
  CONTENT
  :::
  ```

Directives are grouped by purpose.

See the dedicated docs for detailed usage:

- [Example](docs/directives/example.md)
- [Indentation](docs/directives/indentation.md)
- [Variables & simple state](docs/directives/variables-and-state.md)
- [Ranges](docs/directives/ranges.md)
- [Arrays & collection management](docs/directives/arrays.md)
- [Data retrieval & evaluation](docs/directives/data-retrieval.md)
- [Conditional logic](docs/directives/conditional-logic.md)
- [Iteration](docs/directives/iteration.md)
- [Event & trigger blocks](docs/directives/event-trigger-blocks.md)
- [Navigation & composition](docs/directives/navigation-composition.md)
- [Transitions](docs/directives/transitions.md)
- [Persistence](docs/directives/persistence.md)
- [Localization & internationalization](docs/directives/localization.md)

Campfire prints descriptive error messages to the browser console when it encounters invalid markup.

## Further reading

- [Twine documentation](https://twinery.org/)
- [remark-directive](https://github.com/remarkjs/remark-directive)
- [i18next](https://www.i18next.com/)
