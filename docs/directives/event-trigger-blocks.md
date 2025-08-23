# Event & trigger blocks

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
  :::trigger{label="Do it" className="primary" disabled}
  :set[key=value]
  :::
  ```

  The `label` attribute must be a quoted string using matching single-, double-,
  or backtick quotes. Replace the label, class name, disabled state, and
  directives as needed.

  | Input     | Description                            |
  | --------- | -------------------------------------- |
  | label     | Text displayed on the button           |
  | className | Optional space-separated classes       |
  | disabled  | Optional boolean to disable the button |
