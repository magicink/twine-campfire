# Styling elements

Campfire's visual components expose hook classes prefixed with `campfire-`, letting you theme the interface without having to override unwanted defaults. Common selectors include:

- `.campfire-base` – root story container
- `.campfire-passage` – wrapper around rendered passages; includes `h-full` for full height
- `.campfire-link` – buttons generated from Twine `[[Link]]` syntax
- `.campfire-trigger` – buttons created by the trigger directive
- `.campfire-deck` – presentation deck container
- `.campfire-slide` – individual slide wrapper
- `.campfire-slide-layer` – positioned layer within a slide
- `.campfire-slide-image` – image element placed via slide directives
- `.campfire-slide-text` – text element placed via slide directives
- `.campfire-slide-shape` – SVG shape element placed via slide directives
- `.campfire-slide-reveal` – wrapper for revealable slide content
- `.campfire-debug-window` – debugging interface
- `.campfire-show` – value display from the `show` directive
- `.campfire-translate` – translated string from the `translate` directive

Most classes ship with no associated styles. `.campfire-passage` includes `h-full` to stretch passages to full height, and `.campfire-link` and `.campfire-trigger` share a button style set for convenience.

## Default color ranges

The template exposes several CSS variables that map to Tailwind color scales:

- `--color-gray-50` through `--color-gray-950` define a neutral gray range.
- `--color-primary-50` through `--color-primary-950` alias the indigo palette. `--color-primary` defaults to `--color-primary-700`, and `--color-primary-foreground` uses `--color-gray-950`.
- `--color-destructive-50` through `--color-destructive-950` alias the red palette. `--color-destructive` defaults to `--color-destructive-500`.
- `--color-ring` derives from `--color-primary-500` and is used for focus indicators.

All values are expressed in `oklch()` notation and can be overridden to suit your theme.
