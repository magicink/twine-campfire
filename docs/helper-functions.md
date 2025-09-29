# Helper functions

Campfire provides a handful of globally available helpers that you can call from directive expressions. Use them to read metadata about the running story or to simplify common logic without having to define your own utilities inside passages.

## `getStoryTitle()`

Return the display name of the current story. The helper inspects the story data loaded by Campfire and reads the `StoryTitle` metadata, making it easy to surface the canonical title anywhere in your UI.

### Signature

```ts
getStoryTitle(): string
```

### Returns

A string containing the exact title configured for the story.

### Usage

Store the story title in state so it can be reused later in your passage content:

```md
::set[currentStoryTitle=getStoryTitle()]
```

You can then interpolate `currentStoryTitle` elsewhere in the same passage or in subsequent directives.

## `getLanguages()`

Retrieve every locale that has a defined display label. The helper inspects Campfire's i18next resource store and collects language codes that have been configured with a `::setLanguageLabel` directive.

### Signature

```ts
getLanguages(): { code: string; label: string }[]
```

### Returns

An array of objects containing the locale `code` and its human-friendly `label`. If localization has not been initialized yet, the helper returns an empty array.

### Usage

The Storybook `Campfire/Directives/Localization → LanguageSelect` story demonstrates building a locale selector that stays in sync with your translation resources. The story stores available languages in state and renders a `<select>` menu driven by the helper:

```md
::set[languages=getLanguages()]

:::select[lang]{label="Choose a language" data-testid="language-select"}
:::for[l in languages]
::option{value=l.code label=l.label}
:::
:::
```
