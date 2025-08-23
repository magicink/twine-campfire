# Example

Here's a practical example showing how directives can be combined to create interactive content:

```md
:createRange[testRange=0]{min=0 max=10}

The value is currently :show[testRange]

:::trigger{label="add"}
:setRange[testRange=(testRange.value+1)]
:::

:::if[testRange.value === testRange.max]
[[Next Page->Next]]
:::
```

This example creates a numeric range with a minimum of 0 and maximum of 10, displays the current value, provides a button to increment the value, and shows a link to the next passage when the maximum value is reached.
