# Inputs & triggers

Collect data from players or run directives on demand with interactive elements.

- `input`: Render a text input bound to a game state key. Use as a leaf or container. The container form can include event directives.

  ```md
  :input[name]{placeholder="Your name"}

  :::input[name]
  :::onFocus
  :set[focused=true]
  :::
  :::
  ```

  | Input       | Description                                |
  | ----------- | ------------------------------------------ |
  | state_key   | Key in game state to store the input value |
  | placeholder | Optional text shown when empty             |
  | type        | Optional input `type` attribute            |
  | className   | Optional space-separated classes           |
  | style       | Optional inline style declarations         |

- `trigger`: Render a button that runs directives when clicked. Supports event directives inside the block.

  ```md
  :::trigger{label="Do it" className="primary"}
  :::onHover
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

Use event directives inside `input` or `trigger` blocks to run directives on interaction.

| Directive | Fires when the element... |
| --------- | ------------------------- |
| `onHover` | is hovered by the pointer |
| `onFocus` | receives focus            |
| `onBlur`  | loses focus               |
