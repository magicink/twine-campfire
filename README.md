# twine-campfire

A cozy story format for Twine.

## Twine links

Campfire recognizes Twine's `[[Link]]` syntax. The text inside becomes a button
that jumps to the target passage. Use an arrow to specify a different target:

```md
[[Display text->Passage name]]
```

## Markdown formatting

Campfire accepts all standard Markdown formatting options provided by [remark-gfm](https://github.com/remarkjs/remark-gfm). This includes tables, strikethrough, task lists, autolinks, and more.

**Examples:**

- **Table:**

  | Name  | HP  |
  | ----- | --- |
  | Alice | 10  |
  | Bob   | 8   |

- **Strikethrough:**

  ~~This text is crossed out.~~

- **Task list:**
  - [x] Find the key
  - [ ] Open the door

- **Autolink:**

  <https://twine-campfire.dev>

## Markdown Directives

Campfire extends standard Markdown with [remark-directive](https://github.com/remarkjs/remark-directive) syntax. Directives begin with a colon and let passages interact with the game state.

Directives come in two forms:

- **Leaf/Text** – `:name[Label]{attr=value}` inline directives.
- **Container** –

  ```
  :::name{attr=value}
  content
  :::
  ```

### Supported directives

- `set` – update game data

  ```md
  :set[number]{hp=5}
  ```

- `setOnce` – like `set` but locks the key after first use

  ```md
  :setOnce{visited=true}
  ```

- `get` – insert a value from the game data

  ```md
  HP: :get{hp}
  ```

- `math` – evaluate an expression and insert the result. Add `key` to store it.

  ```md
  Result: :math[1 + 2]
  :math[hp + 5]{key=hp}
  ```

- `random` – store a random number or choice in a key

  ```md
  :random{key=loot,min=1,max=5}
  ```

- `range` – create a numeric range object using the `set` directive

  ```md
  :set[range]{key=hp min=0 max=10 value=5}
  ```

- `increment` – increase a numeric value

  ```md
  :increment{key=score amount=2}
  ```

- `decrement` – decrease a numeric value

  ```md
  :decrement{key=hp amount=1}
  ```

- `unset` – remove a key

  ```md
  :unset{key=tempFlag}
  ```

- `if`/`elseif`/`else` – conditional blocks

  ```md
  :::if{hp > 0}
  You live!
  :::else
  Game over
  :::
  ```

- `include` – insert another passage by name or id

  ```md
  :include[Intro]
  :include[42]
  ```

- `once` – execute a block only the first time it's encountered

  ```md
  :::once{intro}
  This text appears only once.
  :::
  ```

- `onEnter` – run directives when entering a passage

  ```md
  :::onEnter
  :set{visited=true}
  :::
  ```

- `onExit` – run directives when leaving a passage

  ```md
  :::onExit
  :set{visited=false}
  :::
  ```

- `onChange` – run directives when a game data key changes

  ```md
  :::onChange{key=hp}
  :set{warn=true}
  :::
  ```

### Checkpoints

Use checkpoints to let players save and restore progress. These directives are
ignored inside passages brought in with `:include`.

- `checkpoint` – save the current game state with an optional label

  ```md
  :checkpoint{id=save1 label="Start"}
  ```

- `restore` – load a saved state. If no `id` is supplied, the most recent checkpoint is restored.

  ```md
  :restore{id=save1}
  :restore
  ```

Multiple checkpoints in the same passage are ignored and log an error. An error
is also recorded if `restore` cannot find the requested checkpoint.

### Localization

Campfire uses [i18next](https://www.i18next.com/) to manage translations. For a
full introduction, read the [i18next documentation](https://www.i18next.com/overview/introduction).
The directives below let you control languages and add translation data.

- `lang` – switch the active locale

  ```md
  :lang{locale=fr}
  ```

- `translations` – add multiple translations. If a namespace (`ns`) is provided, it will be created if needed.

  ```md
  :translations{ns=ui locale=fr hello="Bonjour" bye="Au revoir"}
  ```

- `t` – output a translated string

  ```md
  :t{key=hello ns=ui}
  ```

  You can translate link text as well:

  ```md
  [[:t{key=next}->Next]]
  ```

To use plural forms, add separate `_one` and `_other` keys and supply a `count`
attribute:

```md
:translations{ns=ui apple_one="1 apple" apple_other="{{count}} apples"}
:t{key=apple count=2 ns=ui}
```

#### i18next namespaces

i18next organizes translations into namespaces. The `translations` directive
creates a namespace when an `ns` attribute is provided and adds keys to it.
Reference the namespace when translating strings:

```md
:translations{ns=ui locale=fr cancel="Annuler"}
:t{key=cancel ns=ui}
```

## Error handling

- `clearErrors` – remove all logged game errors

  ```md
  :clearErrors
  ```
