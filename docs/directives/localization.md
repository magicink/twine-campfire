# Localization & internationalization

Change language and handle translations.

### `lang`

Switch the active locale. Use as a leaf directive.

```md
::lang[lang]
```

Replace `lang` with a locale like `fr`.

| Input  | Description             |
| ------ | ----------------------- |
| locale | Locale code to activate |

### `t`

Output a translated string or expression. Use the optional `count` attribute for pluralization and `fallback` for default text when the translation is missing.

```md
:t[ui:apple]{count=2}
:t[apple]{ns="ui"}
:t[favoriteFruit]
:t[missing]{fallback=`Hello ${player}`}
```

Replace `apple` and `ui` with your key and namespace. You can also provide the
namespace via the `ns` attribute or supply a JavaScript expression that
resolves to the key. The `fallback` attribute accepts either a
quoted string or a template literal. For interpolation, use backticks without
wrapping the value in quotes.

The directive also accepts `className` and `style` attributes for styling the
output.

| Input     | Description                            |
| --------- | -------------------------------------- |
| ns:key    | Namespace and key of the translation   |
| ns        | Optional namespace for the translation |
| count     | Optional count for pluralization       |
| fallback  | Fallback text when key is missing      |
| className | Additional classes applied to the span |
| style     | Inline styles applied to the span      |

### `translations`

Add a translation as a leaf directive.

```md
::translations[lang]{ui:hello="BONJOUR"}
```

Replace `lang` with the locale and `ui` with the namespace. Only one
`namespace:key="value"` pair is allowed per directive. Repeat the directive
for additional translations.

```md
::translations[en]{ui:greeting="Hello, {{name}}!"}
:t[greeting]{ns="ui" name="Aiden"}
```

Attributes on `:t` become interpolation variables for i18next.

| Input  | Description                     |
| ------ | ------------------------------- |
| locale | Locale code for the translation |
| ns:key | Namespace and key to translate  |
| value  | Translated string               |

### `setLanguageLabel`

Provide a display label for a locale. Use as a leaf directive.

```md
::setLanguageLabel[fr="Français"]
```

Replace `fr` with the locale code and supply the label in quotes. The label is
stored in i18next under the `language` namespace for the specified locale.

| Input     | Description                  |
| --------- | ---------------------------- |
| lang_code | Locale code to label         |
| label     | Display label for the locale |

Campfire prints descriptive error messages to the browser console when it encounters invalid markup.

### `getLanguages`

Return all locales that have a user-facing label. Each entry includes the
locale `code` and its `label`. The utility is exposed on the global object so it
can be called from directive expressions.

```md
::setLanguageLabel[en-US="English (US)"]
::setLanguageLabel[fr="Français"]
::set[languages=getLanguages()]
```

The final `languages` array will contain `{code, label}` pairs for each locale
with a defined label.

Combine `setLanguageLabel` and `getLanguages` to build a language picker. Watch the `lang` state with an `effect` block so the active locale updates whenever the selection changes:

```md
::set[lang="en-US"]
::setLanguageLabel[en-US="English (US)"]
::setLanguageLabel[fr="Français"]
::setLanguageLabel[th="ไทย"]

::translations[en-US]{ui:greet="Hello"}
::translations[fr]{ui:greet="Bonjour"}
::translations[th]{ui:greet="สวัสดี"}

::set[languages=getLanguages()]

:::effect[watch=lang]
::lang[lang]
:::

:::select[lang]{label="Choose a language"}
:::for[l in languages]
::option{value=l.code label=l.label}
:::
:::

:t[ui:greet]
```

Omit quotes around attribute values when referencing state keys or expressions.
