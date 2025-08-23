# Ranges

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
