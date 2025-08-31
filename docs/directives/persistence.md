# Persistence

Save and load progress or store data in the browser.

## Checkpoints

### `checkpoint`

Save the current game state.

```md
:checkpoint{id="SAVE-ID" label="LABEL"}
```

Replace `SAVE-ID` with a key and `LABEL` with a description. Wrap the `id`
value in quotes or backticks unless referencing a state key. Saving a new
checkpoint replaces any existing checkpoint.

| Input | Description                          |
| ----- | ------------------------------------ |
| id    | Key used to store the checkpoint     |
| label | Description shown for the checkpoint |

### `clearCheckpoint`

Remove the saved checkpoint.

```md
:clearCheckpoint
```

Removes the currently stored checkpoint. Only one checkpoint can exist at a
time, so this directive has no attributes.

| Input    | Description                  |
| -------- | ---------------------------- |
| _(none)_ | This directive has no inputs |

### `loadCheckpoint`

Load a saved checkpoint.

```md
:loadCheckpoint
```

Loads the currently stored checkpoint. Only one checkpoint can exist at a
time, so this directive has no attributes.

| Input    | Description                  |
| -------- | ---------------------------- |
| _(none)_ | This directive has no inputs |

## Saves

### `save`

Write the current state to local storage.

```md
:save{id="SLOT"}
```

Replace `SLOT` with the storage id. Wrap the `id` value in quotes or
backticks unless referencing a state key.

| Input | Description                   |
| ----- | ----------------------------- |
| id    | Storage key for the save slot |

### `load`

Load state from local storage.

```md
:load{id="SLOT"}
```

Replace `SLOT` with the storage id. Wrap the `id` value in quotes or
backticks unless referencing a state key.

| Input | Description              |
| ----- | ------------------------ |
| id    | Storage key to load from |

### `clearSave`

Remove a stored game state.

```md
:clearSave{id="SLOT"}
```

Replace `SLOT` with the storage id. Wrap the `id` value in quotes or
backticks unless referencing a state key.

| Input | Description           |
| ----- | --------------------- |
| id    | Storage key to remove |
