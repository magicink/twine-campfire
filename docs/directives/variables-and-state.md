# Variables, ranges & arrays

Operations that set, update, or remove scalar values, manage numeric ranges, and manipulate arrays.

State directives must use the leaf `::` prefix unless otherwise noted. Inline `:` forms are not supported.

> **Note:** The `eval` directive has been removed. Remove any existing uses from your stories.

### `set`

Assign a value to a key. This directive is leaf-only and cannot wrap content.

```md
::set[key=value]
```

Replace `key` with the key name and `value` with the number, string, or expression to store. Quoted values are treated as strings, `true`/`false` as booleans, values wrapped in `{}` as objects, purely numeric values as numbers and any other value is evaluated as an expression or state reference.

| Input | Description                  |
| ----- | ---------------------------- |
| key   | State key to assign          |
| value | Value or expression to store |

```md
::set[health=100]
::set[playerName="John"]
::set[isActive=true]
```

Set multiple keys in one directive by separating assignments with spaces:

```md
::set[color="red" cls="big"]
```

### `setOnce`

Set a key only if it has not been set. This directive is leaf-only and cannot wrap content.

```md
::setOnce[visited=true]
```

| Input | Description                  |
| ----- | ---------------------------- |
| key   | State key to set once        |
| value | Value to assign on first use |

Replace `visited` with the key to lock on first use.

### `random`

Assign a random value. This directive is leaf-only and cannot wrap content.

```md
::random[hp]{min=min_val max=max_val}
```

Replace `hp` with the key and `min_val`/`max_val` with bounds. You can also pick a random item from an array:

```md
::random[pick]{from=['a string',some_key,true,42]}
::random[pick]{from=items}
```

Replace `pick` with the key to store the result and supply either a literal array or a state key after `from`. Use either `min`/`max` _or_ `from`, but not both. When using a numeric range, both `min` and `max` are required.

| Input | Description                                     |
| ----- | ----------------------------------------------- |
| key   | State key to assign                             |
| min   | Minimum value for numeric range                 |
| max   | Maximum value for numeric range                 |
| from  | Array or state key to select a random item from |

### `randomOnce`

Assign a random value once and lock the key.

```md
::randomOnce[roll]{min=1 max=6}
```

| Input | Description                                     |
| ----- | ----------------------------------------------- |
| key   | State key to assign                             |
| min   | Minimum value for numeric range                 |
| max   | Maximum value for numeric range                 |
| from  | Array or state key to select a random item from |

**For both `random` and `randomOnce`, provide either `min`/`max` or `from`.**

Use this to store a random value that should not change on subsequent runs.

### `unset`

Remove a key from state. Provide the state key as the directive label. This directive is leaf-only and cannot wrap content.

```md
::unset[visited]
```

| Input | Description         |
| ----- | ------------------- |
| key   | State key to remove |

Replace `visited` with the key to remove.

## Object properties

Wrap a value in `{}` to store an object in state and access its properties with
dot or bracket notation.

```md
::set[player={hp: 10, mana: 5}]
::set[currentHp=player.hp]
```

## Ranges

Create and update numeric ranges.

### `createRange`

Create a new numeric range.

```md
::createRange[score=0]{min=0 max=10}
```

Replace `score` with the range key and `0` with the starting value. `min` and `max` define the bounds.

| Input | Description                  |
| ----- | ---------------------------- |
| key   | State key to store the range |
| value | Initial value for the range  |
| min   | Minimum allowed value        |
| max   | Maximum allowed value        |

### `setRange`

Update the value of an existing range.

```md
::setRange[score=(score.value+1)]
```

Replace `score` with the range key and provide a new value or expression.

| Input | Description                   |
| ----- | ----------------------------- |
| key   | Range key to update           |
| value | Value or expression to assign |

Range values are objects with `value`, `min`, and `max` properties. Access them using dot notation such as `score.value`, `score.min`, and `score.max`.

## Arrays & collection management

Create or modify lists of values.

> Only use these directives for arrays—JavaScript's built-in methods can lead
> to unpredictable behavior.

### `array`

Create an array.

```md
::array[items=[1,2,'three',"four"]]
```

Replace `items` with the array name. The directive accepts a single
`key=[...]` pair where the value is in array notation. Items are
automatically converted to strings, numbers, or booleans and may include
expressions evaluated against the current state.

| Input | Description                      |
| ----- | -------------------------------- |
| key   | Name of the array to create      |
| [...] | Initial values in array notation |

### `arrayOnce`

Create an array only if it has not been set.

```md
::arrayOnce[visited=['FOREST',"CAVE"]]
```

This behaves like `array` but locks the key after execution, preventing
further changes.

| Input | Description                      |
| ----- | -------------------------------- |
| key   | Name of the array to create      |
| [...] | Initial values in array notation |

### `concat`

Combine arrays.

```md
::concat{key=items value=moreItems}
```

Replace `items` with the target array and `moreItems` with the source.

| Input | Description                    |
| ----- | ------------------------------ |
| key   | Target array to modify         |
| value | Array whose items are appended |

### `pop`

Remove the last item. Use `into` to store it.

```md
::pop{key=items into=lastItem}
```

Replace `items` with the array and `lastItem` with the storage key.

| Input | Description                            |
| ----- | -------------------------------------- |
| key   | Array to modify                        |
| into  | Optional key to store the removed item |

### `push`

Add items to the end of an array.

```md
::push{key=items value=newItem}
```

Replace `items` with the array and `newItem` with items to add.

| Input | Description     |
| ----- | --------------- |
| key   | Array to modify |
| value | Items to append |

### `shift`

Remove the first item. Use `into` to store it.

```md
::shift{key=items into=firstItem}
```

Replace `items` with the array and `firstItem` with the storage key.

| Input | Description                            |
| ----- | -------------------------------------- |
| key   | Array to modify                        |
| into  | Optional key to store the removed item |

### `splice`

Remove items at an index and optionally insert new ones. Use `into` to store removed items.

```md
::splice{key=items index=value count=value into=removedItems}
```

Replace `items` with the array and adjust attributes as needed.

| Input | Description                         |
| ----- | ----------------------------------- |
| key   | Array to modify                     |
| index | Starting index for removal          |
| count | Number of items to remove           |
| value | Items to insert                     |
| into  | Optional key to store removed items |

### `unshift`

Add items to the start of an array.

```md
::unshift{key=items value=newItem}
```

Replace `items` with the array and `newItem` with items to add.

| Input | Description      |
| ----- | ---------------- |
| key   | Array to modify  |
| value | Items to prepend |
