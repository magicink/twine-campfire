# Inputs and events

Collect data from players or run directives on demand with interactive elements, or respond to passage events.

## Inputs & triggers

Collect data or trigger actions directly in the passage.

### `input`

Render a text input bound to a game state key. Use as a leaf or container. The container form can include event directives. If the key already exists in game state, its value is used; otherwise, the optional `value` attribute sets the starting value.

Leaf form:

```md
:input[name]{placeholder="Your name"}
```

Container form:

```md
:::input[email]
:::onFocus
:set[focused=true]
:::
:::
```

| Input       | Description                                |
| ----------- | ------------------------------------------ |
| state_key   | Key in game state to store the input value |
| placeholder | Optional text shown when empty             |
| value       | Initial value when the state key is unset  |
| type        | Optional input `type` attribute            |
| className   | Optional space-separated classes           |
| style       | Optional inline style declarations         |

### `textarea`

Render a multi-line text area bound to a game state key. Use as a leaf or container. The container form can include event directives. If the key already exists in game state, its value is used; otherwise, the optional `value` attribute sets the starting value.

Leaf form:

```md
:textarea[bio]{placeholder="Your bio"}
```

Container form:

```md
:::textarea[bio]
:::onFocus
:set[focused=true]
:::
:::
```

| Input       | Description                                   |
| ----------- | --------------------------------------------- |
| state_key   | Key in game state to store the textarea value |
| placeholder | Optional text shown when empty                |
| rows        | Optional number of visible text rows          |
| value       | Initial value when the state key is unset     |
| className   | Optional space-separated classes              |
| style       | Optional inline style declarations            |

### `select`

Render a dropdown bound to a game state key. Must be used as a container with nested `option` directives. The container form can include event directives. If the key already exists in game state, its value is used; otherwise, the optional `value` attribute sets the initial selection. The optional `label` attribute provides placeholder text when no option is chosen.

```md
:::select[color]{label="Choose a color"}
:option{value="red" label="Red"}
:option{value="blue" label="Blue"}
:::
```

| Input     | Description                                  |
| --------- | -------------------------------------------- |
| state_key | Key in game state to store the select value  |
| className | Optional space-separated classes             |
| style     | Optional inline style declarations           |
| value     | Initial selected value when the key is unset |
| label     | Text displayed when no option is selected    |

The select button uses the same default styling as trigger and link buttons and includes a downward caret on the right. The menu closes when clicking outside the button or pressing Escape.

`option` directives accept the following inputs:

| Input     | Description                        |
| --------- | ---------------------------------- |
| value     | Value to store when selected       |
| label     | Text displayed for the option      |
| className | Optional space-separated classes   |
| style     | Optional inline style declarations |

### `trigger`

Render a button that runs directives when clicked. Supports event directives inside the block.

```md
:::trigger{label="Do it" className="primary"}
:::onMouseEnter
:set[hovered=true]
:::
:set[key=value]
:::
```

The `label` attribute must be a quoted string using matching single-, double-, or backtick quotes. Replace the label, class name, disabled state, and directives as needed.

| Input     | Description                            |
| --------- | -------------------------------------- |
| label     | Text displayed on the button           |
| className | Optional space-separated classes       |
| disabled  | Optional boolean to disable the button |
| style     | Optional inline style declarations     |

### Event directives

Use event directives inside `input`, `select`, or `trigger` blocks to run directives on interaction.

| Directive      | Fires when the element...    |
| -------------- | ---------------------------- |
| `onMouseEnter` | the pointer enters           |
| `onMouseExit`  | the pointer leaves           |
| `onMouseDown`  | the mouse button is pressed  |
| `onMouseUp`    | the mouse button is released |
| `onFocus`      | receives focus               |
| `onBlur`       | loses focus                  |

## Passage event blocks

Run directives on specific passage events or group actions.

### `batch`

Apply multiple directives as a single update.

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

### `onExit`

Run data directives once when leaving the passage.

```md
:::onExit
:set[key=value]
:::
```

Only one `onExit` block is allowed per passage. Its contents are hidden, and it supports only the following directives: `if`, `set`, `setOnce`, `array`, `arrayOnce`, `unset`, `random`, `randomOnce`, and `batch`.

| Input    | Description                  |
| -------- | ---------------------------- |
| _(none)_ | This directive has no inputs |
