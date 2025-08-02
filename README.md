# twine-campfire

A cozy story format for Twine.

## Harlowe-style links

Campfire recognizes Twine's `[[Link]]` syntax. The text inside becomes a button
that jumps to the target passage. Use an arrow to specify a different target:

```md
[[Display text->Passage name]]
```

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
  :set[range]{hp='{"lower":0,"upper":10,"value":5}'}
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

### Localization

Campfire uses [i18next](https://www.i18next.com/) to manage translations. For a
full introduction, read the [i18next documentation](https://www.i18next.com/overview/introduction).
The directives below let you control languages and add translation data.

- `lang` – switch the active locale

  ```md
  :lang{locale=fr}
  ```

- `namespace` – register a translation namespace

  ```md
  :namespace{ns=ui locale=fr data={"hello":"Bonjour"}}
  ```

- `translations` – add multiple translations

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

i18next organizes translations into namespaces. Use the `namespace` directive to
register a namespace and optionally provide initial data. The `translations`
directive adds or updates keys within a namespace. Reference the namespace when
translating strings:

```md
:namespace{ns=ui locale=fr data={"ok":"D'accord"}}
:translations{ns=ui locale=fr cancel="Annuler"}
:t{key=ok ns=ui}
```
