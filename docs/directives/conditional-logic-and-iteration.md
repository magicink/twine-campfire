# Conditional logic & iteration

Control whether and how many times content renders.

## Conditional logic

Run content only when conditions hold.

### `if`

Render a block when a JavaScript expression against game data is truthy. Add an `else` container for fallback content.

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

::set[door_opened=true]

[[Enter->Hallway]]

:::
```

Replace the keys with those from your game data.

| Input      | Description                                  |
| ---------- | -------------------------------------------- |
| expression | JavaScript condition evaluated against state |

## Iteration

Repeat blocks for each item in a collection.

### `for`

Render content for every element in an array or range.

```md
:::for[item in [1,2,3]]

Item: :show[item]

:::
```

With ranges:

```md
::createRange[r=0]{min=1 max=3}

:::for[x in r]

Number: :show[x]

:::
```

Renders nothing for empty iterables.

| Input      | Description                            |
| ---------- | -------------------------------------- |
| variable   | Name assigned to each item             |
| expression | Array or range evaluated against state |
