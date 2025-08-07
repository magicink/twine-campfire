# twine-campfire

A cozy story format for Twine.

## Installation

1. Visit the [Twine Campfire releases page](https://github.com/magicink/twine-campfire/releases) and open the latest release.
2. Copy the URL of the `format.js` file listed under **Assets**.
3. Start Twine and navigate to **Twine > Story Formats**.
4. Click **Add**, paste the copied URL into the form, then confirm.
5. To activate the format, open a story and choose **campfire 1.x.x** from the **Story Format** dropdown in **Story > Details**.

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

- **Heading**

  Markdown heading syntax (`#`, `##`, etc.) is not currently supported, so
  lines starting with `#` will render as plain text.

## Directives

Campfire extends Markdown with
[remark-directive](https://github.com/remarkjs/remark-directive) syntax.
Directives begin with a colon and let passages interact with the game state.
They come in leaf or container form.

- **Leaf/Text** – `:name[LABEL]{attr=VALUE}`
- **Container** –

  ```md
  :::name{attr=VALUE}
  CONTENT
  :::
  ```

Directives are grouped by purpose.

### Variables & simple state

Operations that set, update or remove scalar values.

- `random`: Assign a random integer.

  ```md
  :random{key=HP min=MIN max=MAX}
  ```

  Replace `HP` with the key and `MIN`/`MAX` with bounds.

- `set[range]`: Initialize a key with a numeric range.

  ```md
  :::set[range]{key=HP min=MIN max=MAX value=VALUE}
  :::
  ```

  Replace `HP` with the key, `MIN`/`MAX` with bounds and `VALUE` with the
  starting number (defaults to `MIN`).

- `set`: Assign a value to a key.

  ```md
  :::set{key=HP value=VALUE}
  :::
  ```

  Replace `VALUE` with the number or string to store.

- `setOnce`: Set a key only if it has not been set.

  ```md
  :::setOnce{key=visited value=true}
  :::
  ```

  Replace `visited` with the key to lock on first use.

- `unset`: Remove a key from state.

  ```md
  :unset{key=HP}
  ```

  Replace `HP` with the key to remove.

### Arrays & collection management

Create or modify lists of values.

> Only use these directives for arrays—JavaScript's built-in methods can lead
> to unpredictable behavior.

- `array`: Create an array.

  ```md
  :array{key=ITEMS values=1,2,3}
  ```

  Replace `ITEMS` with the array name.

- `arrayOnce`: Create an array only if it has not been set.

  ```md
  :arrayOnce{key=VISITED values=FOREST,CAVE}
  ```

  Replace `VISITED` with the array name.

- `concat`: Combine arrays.

  ```md
  :concat{key=ITEMS value=MORE-ITEMS}
  ```

  Replace `ITEMS` with the target array and `MORE-ITEMS` with the source.

- `pop`: Remove the last item. Use `into` to store it.

  ```md
  :pop{key=ITEMS into=LAST}
  ```

  Replace `ITEMS` with the array and `LAST` with the storage key.

- `push`: Add items to the end of an array.

  ```md
  :push{key=ITEMS value=NEW-ITEM}
  ```

  Replace `ITEMS` with the array and `NEW-ITEM` with items to add.

- `shift`: Remove the first item. Use `into` to store it.

  ```md
  :shift{key=ITEMS into=FIRST}
  ```

  Replace `ITEMS` with the array and `FIRST` with the storage key.

- `splice`: Remove items at an index and optionally insert new ones. Use `into`
  to store removed items.

  ```md
  :splice{key=ITEMS index=VALUE count=VALUE into=REMOVED}
  ```

  Replace `ITEMS` with the array and adjust attributes as needed.

- `unshift`: Add items to the start of an array.

  ```md
  :unshift{key=ITEMS value=NEW-ITEM}
  ```

  Replace `ITEMS` with the array and `NEW-ITEM` with items to add.

### Data retrieval & evaluation

Read or compute data without mutating state.

- `defined`: Check if a key exists.

  ```md
  :defined{key=HP}
  ```

  Replace `HP` with the key to test.

- `math`: Perform a calculation and store the result under a key.

  ```md
  :math[HP + VALUE]{key=RESULT}
  ```

  Replace `RESULT` with the key to store and `HP`/`VALUE` with numbers or
  keys. Use `:show` to display stored values.

- `show`: Display a key's value.

  ```md
  :show{key=hp}
  ```

  Replace `hp` with the key to display.

### Conditional logic

Run content only when conditions hold.

- `if`: Render a block when a JavaScript expression against game data is truthy. Add an `else` container for fallback content.

  ```md
  :::if{some_key}
  CONTENT WHEN `some_key` IS TRUTHY
  :::

  :::if{!some_key}
  CONTENT WHEN `some_key` IS FALSY
  :::

  :::if{!!some_key}
  CONTENT WHEN `some_key` COERCES TO TRUE
  :::

  :::if{key_a < key_b}
  CONTENT WHEN `key_a` IS LESS THAN `key_b`
  :::

  :::if{typeof key_a !== "string"}
  CONTENT WHEN `key_a` IS NOT A STRING
  :::

  :::if{some_key}
  TRUTHY CONTENT
  :::else
  FALLBACK CONTENT
  :::

  :::if{has_key}
  You unlock the door.
  :::set{key=door_opened value=true}
  :::
  [[Enter->Hallway]]
  :::
  ```

  Replace the keys with those from your game data.

- `once`: Run content once per key.

  ```md
  :::once{key=SCENE}
  CONTENT
  :::
  ```

  Replace `SCENE` with a unique key for the block.

### Event & trigger blocks

Run directives on specific passage events or group actions.

- `batch`: Apply multiple directives as a single update.

  ```md
  :::batch
  :::set{key=HP value=VALUE}
  :::
  :push{key=items value=sword}
  :unset{key=old}
  :::
  ```

  Replace values as needed.

- `trigger`: Render a button that runs directives when clicked.

  ```md
  :::trigger{label="Do it" class="primary" disabled}
  :::set{key=KEY value=VALUE}
  :::
  :::
  ```

  Replace the label, classes, disabled state, and directives as needed.

### Navigation & composition

Control the flow between passages or how they appear.

- `goto`: Jump to another passage.

  ```md
  :goto{passage=PASSAGE-NAME}
  ```

  Replace `PASSAGE-NAME` with the target passage.

- `include`: Embed another passage's content.

  ```md
  :include{passage=PASSAGE-NAME}
  ```

  Replace `PASSAGE-NAME` with the passage to include. Nested includes are
  limited to 10 levels to prevent infinite loops.

- `title`: Set the document title.

  ```md
  :title{value=GAME-TITLE}
  ```

  Replace `GAME-TITLE` with the text to display.

### Checkpoints & persistence

Save and restore progress or store data in the browser.

- `checkpoint`: Save the current game state.

  ```md
  :checkpoint{id=SAVE-ID label="LABEL"}
  ```

  Replace `SAVE-ID` with a key and `LABEL` with a description.

- `clearCheckpoint`: Remove a saved checkpoint.

  ```md
  :clearCheckpoint{id=SAVE-ID}
  ```

  Replace `SAVE-ID` with the checkpoint to remove.

- `clearSave`: Remove a stored game state.

  ```md
  :clearSave{id=SLOT}
  ```

  Replace `SLOT` with the storage id.

- `load`: Load state from local storage.

  ```md
  :load{id=SLOT}
  ```

  Replace `SLOT` with the storage id.

- `restore`: Load a saved state.

  ```md
  :restore{id=SAVE-ID}
  ```

  Replace `SAVE-ID` with the checkpoint to load.

- `save`: Write the current state to local storage.

  ```md
  :save{id=SLOT}
  ```

  Replace `SLOT` with the storage id.

### Localization & internationalization

Change language and handle translations.

- `lang`: Switch the active locale.

  ```md
  :lang{locale=LANG-CODE}
  ```

  Replace `LANG-CODE` with a locale like `fr`.

- `t`: Output a translated string.

  ```md
  :t{key=HELLO ns=UI}
  ```

  Replace `HELLO` and `UI` with your key and namespace.

- `translations`: Add multiple translations.

  ```md
  :translations{ns=UI locale=LANG-CODE hello="BONJOUR"}
  ```

  Replace `UI` with the namespace, `LANG-CODE` with the locale and adjust
  keys.

### Error handling

Clear logged errors.

- `clearErrors`: Remove all game errors.

  ```md
  :clearErrors
  ```

## Further reading

- [Twine documentation](https://twinery.org/)
- [remark-directive](https://github.com/remarkjs/remark-directive)
- [i18next](https://www.i18next.com/)
