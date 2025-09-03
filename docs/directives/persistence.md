# Persistence

Save and load progress or store data in the browser.

## Checkpoints

### `checkpoint`

Save the current game state. Use as a leaf directive.

```md
::checkpoint{id="SAVE-ID" label="LABEL"}
```

Replace `SAVE-ID` with a key and `LABEL` with a description. Wrap the `id`
value in quotes or backticks unless referencing a state key. Saving a new
checkpoint replaces any existing checkpoint.

| Input | Description                          |
| ----- | ------------------------------------ |
| id    | Key used to store the checkpoint     |
| label | Description shown for the checkpoint |

### `clearCheckpoint`

Remove the saved checkpoint. Use as a leaf directive.

```md
::clearCheckpoint
```

Removes the currently stored checkpoint. Only one checkpoint can exist at a
time, so this directive has no attributes.

| Input    | Description                  |
| -------- | ---------------------------- |
| _(none)_ | This directive has no inputs |

### `loadCheckpoint`

Load a saved checkpoint. Use as a leaf directive.

```md
::loadCheckpoint
```

Loads the currently stored checkpoint. Only one checkpoint can exist at a
time, so this directive has no attributes.

| Input    | Description                  |
| -------- | ---------------------------- |
| _(none)_ | This directive has no inputs |

## Saves

### `save`

Write the current state to local storage. Use as a leaf directive.

```md
::save{id="SLOT"}
```

Replace `SLOT` with the storage id. Wrap the `id` value in quotes or
backticks unless referencing a state key.

| Input | Description                   |
| ----- | ----------------------------- |
| id    | Storage key for the save slot |

### `load`

Load state from local storage. Use as a leaf directive.

```md
::load{id="SLOT"}
```

Replace `SLOT` with the storage id. Wrap the `id` value in quotes or
backticks unless referencing a state key.

| Input | Description              |
| ----- | ------------------------ |
| id    | Storage key to load from |

### `clearSave`

Remove a stored game state. Use as a leaf directive.

```md
::clearSave{id="SLOT"}
```

Replace `SLOT` with the storage id. Wrap the `id` value in quotes or
backticks unless referencing a state key.

| Input | Description           |
| ----- | --------------------- |
| id    | Storage key to remove |

### `listSavedGames`

Retrieve metadata for existing saves. This helper scans `localStorage` for
keys starting with `campfire.save` and returns their labels, passage ids, and
timestamps when available.
Call the function in a directive expression and iterate over the results:

```md
::set[saves=listSavedGames()]
:::for[save in saves]

:show[save.id]

:::
```

Provide a custom prefix to scan a different namespace:

```md
::set[demoSaves=listSavedGames('demo-')]
```
