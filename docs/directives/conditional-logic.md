# Conditional logic

Run content only when conditions hold.

- `if`: Render a block when a JavaScript expression against game data is truthy. Add an `else` container for fallback content.

  Basic truthy check:

  ```md
  :::if[some_key]
  CONTENT WHEN `some_key` IS TRUTHY
  :::
  ```

  Negation check:

  ```md
  :::if[!some_key]
  CONTENT WHEN `some_key` IS FALSY
  :::
  ```

  Double negation for boolean coercion:

  ```md
  :::if[!!some_key]
  CONTENT WHEN `some_key` COERCES TO TRUE
  :::
  ```

  Comparison operators:

  ```md
  :::if[key_a < key_b]
  CONTENT WHEN `key_a` IS LESS THAN `key_b`
  :::
  ```

  Type checking:

  ```md
  :::if[typeof key_a !== "string"]
  CONTENT WHEN `key_a` IS NOT A STRING
  :::
  ```

  Using with else block:

  ```md
  :::if[some_key]
  TRUTHY CONTENT
  :::else
  FALLBACK CONTENT
  :::
  ```

  Combining with other directives and links:

  ```md
  :::if[has_key]
  You unlock the door.
  :set[door_opened=true]
  [[Enter->Hallway]]
  :::
  ```

  Replace the keys with those from your game data.

  | Input      | Description                                  |
  | ---------- | -------------------------------------------- |
  | expression | JavaScript condition evaluated against state |
