# Data retrieval & evaluation

Read or compute data without mutating state.

### `show`

Display a key's value, the result of an expression, or an interpolated string.

```md
:show[hp]
:show[`Hello ${name}`]
:show[some_key > 1 ? "X" : " "]
```

Replace the content with a key, template string, or JavaScript expression to display.

| Input     | Description                                               |
| --------- | --------------------------------------------------------- |
| key       | State key to display                                      |
| as        | Element tag to wrap the output                            |
| className | Additional classes applied to the element (requires `as`) |
| style     | Inline styles applied to the element (requires `as`)      |

By default, the value renders without a wrapper. Provide an `as` attribute
to wrap the output and enable `className` and `style`.

To read range data, access the range's properties with dot notation:

```md
:show[score.value]
:show[score.min]
:show[score.max]
```

Range objects expose `value`, `min`, and `max` fields.
