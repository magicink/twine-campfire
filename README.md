# twine-campfire

A cozy story format for Twine.

## Installation

1. Visit the [Twine Campfire releases page](https://github.com/magicink/twine-campfire/releases) and open the latest release.
2. Copy the URL of the `format.js` file listed under **Assets**.
3. Start Twine and navigate to **Twine > Story Formats**.
4. Click **Add**, paste the copied URL into the form, then confirm.
5. To activate the format, open a story and choose **campfire 1.x.x** from the **Story Format** dropdown in **Story > Details**.

## AI Disclosure

Portions of this project were created with the assistance of AI tools, including ChatGPT and GitHub Copilot.

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

### Example

Here's a practical example showing how directives can be combined to create interactive content:

```md
:createRange[testRange=0]{min=0 max=10}

The value is currently :show[testRange]

:::trigger{label="add"}
:setRange[testRange=(testRange.value+1)]
:::

:::if{testRange.value === testRange.max}
[[Next Page->Next]]
:::
```

This example creates a numeric range with a minimum of 0 and maximum of 10, displays the current value, provides a button to increment the value, and shows a link to the next passage when the maximum value is reached.

### Indentation

Directives preserve leading whitespace, so they can appear inside other
Markdown structures. You can use any amount of spaces or tabs—the parser
ignores the exact indentation:

```md
- Step one
  :set[visited=true]

> Quoted
> :goto["NEXT"]
```

### Variables & simple state

Operations that set, update, or remove scalar values.

- `set`: Assign a value to a key. This directive is leaf-only and cannot wrap
  content.

  ```md
  :set[key=value]
  ```

  Replace `key` with the key name and `value` with the number, string, or
  expression to store. Quoted values are treated as strings, `true`/`false` as
  booleans, values wrapped in `{}` as objects, purely numeric values as numbers
  and any other value is evaluated as an expression or state reference.

  | Input | Description                  |
  | ----- | ---------------------------- |
  | key   | State key to assign          |
  | value | Value or expression to store |

  ```md
  :set[health=100]
  :set[playerName="John"]
  :set[isActive=true]
  ```

- `setOnce`: Set a key only if it has not been set. This directive is leaf-only
  and cannot wrap content.

  ```md
  :setOnce[visited=true]
  ```

  | Input | Description                  |
  | ----- | ---------------------------- |
  | key   | State key to set once        |
  | value | Value to assign on first use |

  Replace `visited` with the key to lock on first use.

- `random`: Assign a random value. This directive is leaf-only and cannot wrap
  content.

  ```md
  :random[hp]{min=min_val max=max_val}
  ```

  Replace `hp` with the key and `min_val`/`max_val` with bounds. You can also pick a random item from an array:

  ```md
  :random[pick]{from=['a string',some_key,true,42]}
  :random[pick]{from=items}
  ```

Replace `pick` with the key to store the result and supply either a literal
array or a state key after `from`. Use either `min`/`max` _or_ `from`, but not
both. When using a numeric range, both `min` and `max` are required.

| Input | Description                                     |
| ----- | ----------------------------------------------- |
| key   | State key to assign                             |
| min   | Minimum value for numeric range                 |
| max   | Maximum value for numeric range                 |
| from  | Array or state key to select a random item from |

Provide either `min`/`max` or `from`.

- `randomOnce`: Assign a random value once and lock the key.

  ```md
  :randomOnce[roll]{min=1 max=6}
  ```

| Input | Description                                     |
| ----- | ----------------------------------------------- |
| key   | State key to assign                             |
| min   | Minimum value for numeric range                 |
| max   | Maximum value for numeric range                 |
| from  | Array or state key to select a random item from |

Provide either `min`/`max` or `from`.

Use this to store a random value that should not change on subsequent runs.

- `unset`: Remove a key from state. This directive is leaf-only and cannot wrap
  content.

  ```md
  :unset{key=visited}
  ```

  | Input | Description         |
  | ----- | ------------------- |
  | key   | State key to remove |

  Replace `visited` with the key to remove.

### Ranges

Create and update numeric ranges.

- `createRange`: Create a new numeric range.

  ```md
  :createRange[score=0]{min=0 max=10}
  ```

  Replace `score` with the range key and `0` with the starting value. `min` and `max` define the bounds.

  | Input | Description                  |
  | ----- | ---------------------------- |
  | key   | State key to store the range |
  | value | Initial value for the range  |
  | min   | Minimum allowed value        |
  | max   | Maximum allowed value        |

- `setRange`: Update the value of an existing range.

  ```md
  :setRange[score=(score.value+1)]
  ```

  Replace `score` with the range key and provide a new value or expression.

  | Input | Description                   |
  | ----- | ----------------------------- |
  | key   | Range key to update           |
  | value | Value or expression to assign |

Range values are objects with `value`, `min`, and `max` properties. Access them using dot notation such as `score.value`, `score.min`, and `score.max`.

### Arrays & collection management

Create or modify lists of values.

> Only use these directives for arrays—JavaScript's built-in methods can lead
> to unpredictable behavior.

- `array`: Create an array.

  ```md
  :array[items=[1,2,'three',"four"]]
  ```

  Replace `items` with the array name. The directive accepts a single
  `key=[...]` pair where the value is in array notation. Items are
  automatically converted to strings, numbers, or booleans and may include
  expressions evaluated against the current state.

  | Input | Description                      |
  | ----- | -------------------------------- |
  | key   | Name of the array to create      |
  | [...] | Initial values in array notation |

- `arrayOnce`: Create an array only if it has not been set.

  ```md
  :arrayOnce[visited=['FOREST',"CAVE"]]
  ```

  This behaves like `array` but locks the key after execution, preventing
  further changes.

  | Input | Description                      |
  | ----- | -------------------------------- |
  | key   | Name of the array to create      |
  | [...] | Initial values in array notation |

- `concat`: Combine arrays.

  ```md
  :concat{key=items value=moreItems}
  ```

  Replace `items` with the target array and `moreItems` with the source.

  | Input | Description                    |
  | ----- | ------------------------------ |
  | key   | Target array to modify         |
  | value | Array whose items are appended |

- `pop`: Remove the last item. Use `into` to store it.

  ```md
  :pop{key=items into=lastItem}
  ```

  Replace `items` with the array and `lastItem` with the storage key.

  | Input | Description                            |
  | ----- | -------------------------------------- |
  | key   | Array to modify                        |
  | into  | Optional key to store the removed item |

- `push`: Add items to the end of an array.

  ```md
  :push{key=items value=newItem}
  ```

  Replace `items` with the array and `newItem` with items to add.

  | Input | Description     |
  | ----- | --------------- |
  | key   | Array to modify |
  | value | Items to append |

- `shift`: Remove the first item. Use `into` to store it.

  ```md
  :shift{key=items into=firstItem}
  ```

  Replace `items` with the array and `firstItem` with the storage key.

  | Input | Description                            |
  | ----- | -------------------------------------- |
  | key   | Array to modify                        |
  | into  | Optional key to store the removed item |

- `splice`: Remove items at an index and optionally insert new ones. Use `into`
  to store removed items.

  ```md
  :splice{key=items index=value count=value into=removedItems}
  ```

  Replace `items` with the array and adjust attributes as needed.

  | Input | Description                         |
  | ----- | ----------------------------------- |
  | key   | Array to modify                     |
  | index | Starting index for removal          |
  | count | Number of items to remove           |
  | value | Items to insert                     |
  | into  | Optional key to store removed items |

- `unshift`: Add items to the start of an array.

  ```md
  :unshift{key=items value=newItem}
  ```

  Replace `items` with the array and `newItem` with items to add.

  | Input | Description      |
  | ----- | ---------------- |
  | key   | Array to modify  |
  | value | Items to prepend |

### Data retrieval & evaluation

Read or compute data without mutating state.

- `show`: Display a key's value.

  ```md
  :show[hp]
  ```

  Replace `hp` with the key to display.

  | Input | Description          |
  | ----- | -------------------- |
  | key   | State key to display |

### Conditional logic

Run content only when conditions hold.

- `if`: Render a block when a JavaScript expression against game data is truthy. Add an `else` container for fallback content.

  Basic truthy check:

  ```md
  :::if{some_key}
  CONTENT WHEN `some_key` IS TRUTHY
  :::
  ```

  Negation check:

  ```md
  :::if{!some_key}
  CONTENT WHEN `some_key` IS FALSY
  :::
  ```

  Double negation for boolean coercion:

  ```md
  :::if{!!some_key}
  CONTENT WHEN `some_key` COERCES TO TRUE
  :::
  ```

  Comparison operators:

  ```md
  :::if{key_a < key_b}
  CONTENT WHEN `key_a` IS LESS THAN `key_b`
  :::
  ```

  Type checking:

  ```md
  :::if{typeof key_a !== "string"}
  CONTENT WHEN `key_a` IS NOT A STRING
  :::
  ```

  Using with else block:

  ```md
  :::if{some_key}
  TRUTHY CONTENT
  :::else
  FALLBACK CONTENT
  :::
  ```

  Combining with other directives and links:

  ```md
  :::if{has_key}
  You unlock the door.
  :set[door_opened=true]
  [[Enter->Hallway]]
  :::
  ```

  Replace the keys with those from your game data.

  | Input      | Description                                  |
  | ---------- | -------------------------------------------- |
  | expression | JavaScript condition evaluated against state |

- `once`: Run content once per key.

  ```md
  :::once{key=SCENE}
  CONTENT
  :::
  ```

  Replace `SCENE` with a unique key for the block.

  | Input | Description                      |
  | ----- | -------------------------------- |
  | key   | Unique key identifying the block |

### Event & trigger blocks

Run directives on specific passage events or group actions.

- `batch`: Apply multiple directives as a single update.

  ```md
  :::batch
  :set[hp=value]
  :push{key=items value=sword}
  :unset{key=old}
  :::
  ```

  Supports only the following directives: `if`, `set`, `setOnce`, `array`, `arrayOnce`, `unset`, `random`, and `randomOnce`. Nested `batch` directives are not allowed.

  | Input    | Description                  |
  | -------- | ---------------------------- |
  | _(none)_ | This directive has no inputs |

- `onExit`: Run data directives once when leaving the passage.

  ```md
  :::onExit
  :set[key=value]
  :::
  ```

  Only one `onExit` block is allowed per passage. Its contents are hidden, and it
  supports only the following directives: `if`, `set`, `setOnce`, `array`, `arrayOnce`, `unset`, `random`,
  `randomOnce`, and `batch`.

  | Input    | Description                  |
  | -------- | ---------------------------- |
  | _(none)_ | This directive has no inputs |

- `trigger`: Render a button that runs directives when clicked.

  ```md
  :::trigger{label="Do it" class="primary" disabled}
  :set[key=value]
  :::
  ```

  The `label` attribute must be a quoted string using matching single-, double-,
  or backtick quotes. Replace the label, classes, disabled state, and directives
  as needed.

  | Input    | Description                            |
  | -------- | -------------------------------------- |
  | label    | Text displayed on the button           |
  | class    | Optional space-separated classes       |
  | disabled | Optional boolean to disable the button |

### Sequences & transitions

Reveal content step by step and animate its appearance.

- `sequence`: Display `step` blocks one at a time.

  ```md
  :::sequence{autoplay delay=1000}
  :::step
  First message
  :::
  :::step
  :::transition{type="fade-in" duration=500}
  Second message
  :::
  :::
  ```

  Use `autoplay` with `delay` to advance automatically. Customize button text
  with `continueLabel` and `skipLabel`. The `fastForward` attribute accepts an
  object for advanced control.

  | Input         | Description                              |
  | ------------- | ---------------------------------------- |
  | autoplay      | Automatically advance steps when true    |
  | delay         | Time in ms between automatic advances    |
  | continueLabel | Text for the continue button             |
  | skipLabel     | Text for the skip button                 |
  | fastForward   | Object controlling fast-forward behavior |

- `step`: Define a single stage within a sequence.

  ```md
  :::step
  Content for this step
  :::
  ```

  Steps may contain `transition` blocks and other directives.

  | Input    | Description                  |
  | -------- | ---------------------------- |
  | _(none)_ | This directive has no inputs |

- `transition`: Animate the appearance of content within a step.

  ```md
  :::transition{type="fade-in" duration=300 delay=100}
  Fades in after 100ms.
  :::
  ```

  `type` currently supports `fade-in`. `duration` and `delay` are in milliseconds.

  | Input    | Description                        |
  | -------- | ---------------------------------- |
  | type     | Animation style (e.g., `fade-in`)  |
  | duration | Animation length in milliseconds   |
  | delay    | Time in ms before animation starts |

### Navigation & composition

Control the flow between passages or how they appear.

- `goto`: Jump to another passage.

  ```md
  :goto["PASSAGE-NAME"]
  ```

  Use quotes or backticks for passage names. Unquoted numbers navigate by pid.
  When using the `passage` attribute, unquoted strings are treated as keys in the
  game state.

  | Input   | Description                            |
  | ------- | -------------------------------------- |
  | passage | Target passage name, pid, or state key |

- `include`: Embed another passage's content.

  ```md
  :include["PASSAGE-NAME"]
  ```

  Use quotes or backticks for passage names. Unquoted numbers include by pid.
  When using the `passage` attribute, unquoted strings are treated as keys in the
  game state. Nested includes are limited to 10 levels to prevent infinite loops.

  | Input   | Description                                |
  | ------- | ------------------------------------------ |
  | passage | Passage name, pid, or state key to include |

- `title`: Set the document title.

  ```md
  :title["GAME-TITLE"]
  ```

  Replace `GAME-TITLE` with the text to display, wrapped in matching quotes or backticks.

  By default, the browser tab displays the story name and current passage name
  separated by a colon. Customize this behavior by adding attributes to the
  `<tw-storydata>` element:
  - `title-separator`: String placed between the story and passage names.
  - `title-show-passage="false"`: Hide the passage name and show only the
    story name.

  | Input | Description                         |
  | ----- | ----------------------------------- |
  | text  | Title text displayed in the browser |

### Persistence

Save and load progress or store data in the browser.

#### Checkpoints

- `checkpoint`: Save the current game state.

  ```md
  :checkpoint{id=SAVE-ID label="LABEL"}
  ```

  Replace `SAVE-ID` with a key and `LABEL` with a description. Saving a new
  checkpoint replaces any existing checkpoint.

  | Input | Description                          |
  | ----- | ------------------------------------ |
  | id    | Key used to store the checkpoint     |
  | label | Description shown for the checkpoint |

- `clearCheckpoint`: Remove the saved checkpoint.

  ```md
  :clearCheckpoint
  ```

  Removes the currently stored checkpoint. Only one checkpoint can exist at a
  time, so this directive has no attributes.

  | Input    | Description                  |
  | -------- | ---------------------------- |
  | _(none)_ | This directive has no inputs |

- `loadCheckpoint`: Load a saved checkpoint.

  ```md
  :loadCheckpoint
  ```

  Loads the currently stored checkpoint. Only one checkpoint can exist at a
  time, so this directive has no attributes.

  | Input    | Description                  |
  | -------- | ---------------------------- |
  | _(none)_ | This directive has no inputs |

#### Saves

- `save`: Write the current state to local storage.

  ```md
  :save{id=SLOT}
  ```

  Replace `SLOT` with the storage id.

  | Input | Description                   |
  | ----- | ----------------------------- |
  | id    | Storage key for the save slot |

- `load`: Load state from local storage.

  ```md
  :load{id=SLOT}
  ```

  Replace `SLOT` with the storage id.

  | Input | Description              |
  | ----- | ------------------------ |
  | id    | Storage key to load from |

- `clearSave`: Remove a stored game state.

  ```md
  :clearSave{id=SLOT}
  ```

  Replace `SLOT` with the storage id.

  | Input | Description           |
  | ----- | --------------------- |
  | id    | Storage key to remove |

### Localization & internationalization

Change language and handle translations.

- `lang`: Switch the active locale.

  ```md
  :lang[lang]
  ```

  Replace `lang` with a locale like `fr`.

  | Input  | Description             |
  | ------ | ----------------------- |
  | locale | Locale code to activate |

- `t`: Output a translated string. Use the optional `count` attribute for
  pluralization.

  ```md
  :t[ui:apple]{count=2}
  ```

  Replace `apple` and `ui` with your key and namespace.

  | Input  | Description                          |
  | ------ | ------------------------------------ |
  | ns:key | Namespace and key of the translation |
  | count  | Optional count for pluralization     |

- `translations`: Add a translation.

  ```md
  :translations[lang]{ui:hello="BONJOUR"}
  ```

  Replace `lang` with the locale and `ui` with the namespace. Only one
  `namespace:key="value"` pair is allowed per directive. Repeat the directive
  for additional translations.

  | Input  | Description                     |
  | ------ | ------------------------------- |
  | locale | Locale code for the translation |
  | ns:key | Namespace and key to translate  |
  | value  | Translated string               |

Campfire prints descriptive error messages to the browser console when it encounters invalid markup.

## Further reading

- [Twine documentation](https://twinery.org/)
- [remark-directive](https://github.com/remarkjs/remark-directive)
- [i18next](https://www.i18next.com/)
