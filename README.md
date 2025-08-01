# twine-campfire

A cozy story format for Twine.

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

- `random` – store a random number or choice in a key

  ```md
  :random{key=loot,min=1,max=5}
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

- `include` – insert another passage

  ```md
  :include[Intro]
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
