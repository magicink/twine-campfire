# Variables & simple state

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

  **For both `random` and `randomOnce`, provide either `min`/`max` or `from`.**

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
