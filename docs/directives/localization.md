# Localization & internationalization

Change language and handle translations.

- `lang`: Switch the active locale.

  ```md
  :lang[lang]
  ```

  Replace `lang` with a locale like `fr`.

  | Input  | Description             |
  | ------ | ----------------------- |
  | locale | Locale code to activate |

- `t`: Output a translated string or expression. Use the optional `count`
  attribute for pluralization and `fallback` for default text when the
  translation is missing.

  ```md
  :t[ui:apple]{count=2}
  :t[favoriteFruit]
  :t[missing]{fallback=`Hello ${player}`}
  ```

  Replace `apple` and `ui` with your key and namespace, or supply a JavaScript
  expression that resolves to one. The `fallback` attribute accepts either a
  quoted string or a template literal. For interpolation, use backticks without
  wrapping the value in quotes.

  | Input    | Description                          |
  | -------- | ------------------------------------ |
  | ns:key   | Namespace and key of the translation |
  | count    | Optional count for pluralization     |
  | fallback | Fallback text when key is missing    |

- `translations`: Add a translation.

  ```md
  :translations[lang]{ui:hello="BONJOUR"}
  ```

  Replace `lang` with the locale and `ui` with the namespace. Only one
  `namespace:key="value"` pair is allowed per directive. Repeat the directive
  for additional translations.

  | Input  | Description                     |
  | ------ | ------------------------------- |
  | locale | Locale code for the translation |
  | ns:key | Namespace and key to translate  |
  | value  | Translated string               |

Campfire prints descriptive error messages to the browser console when it encounters invalid markup.
