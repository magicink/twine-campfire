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

| Input     | Description                            |
| --------- | -------------------------------------- |
| key       | State key to display                   |
| className | Additional classes applied to the span |
| style     | Inline styles applied to the span      |

The directive also supports `className` and `style` attributes for styling the rendered span.

To read range data, access the range's properties with dot notation:

```md
:show[score.value]
:show[score.min]
:show[score.max]
```

Range objects expose `value`, `min`, and `max` fields.
