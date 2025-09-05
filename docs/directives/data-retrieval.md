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
| as        | Element tag to wrap the output (defaults to fragment)     |
| className | Additional classes applied to the element (requires `as`) |
| style     | Inline styles applied to the element (requires `as`)      |

When `as` is omitted, the value is rendered without a wrapper. `className`
and `style` only apply when `as` is defined.

To read range data, access the range's properties with dot notation:

```md
:show[score.value]
:show[score.min]
:show[score.max]
```

Range objects expose `value`, `min`, and `max` fields.
