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

Most classes ship with no associated styles. The exceptions are `.campfire-link` and `.campfire-trigger`, which provide a shared button style set for convenience.

## Predefined button styles

`campfire-link` and `campfire-trigger` both apply the following Tailwind utilities:

```
inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3
```

These utilities provide:

- flexbox alignment and spacing for text and icons
- default sizing for nested SVG icons
- disabled and invalid state feedback
- focus indicators drawn from the `ring` theme token
- foreground/background colors sourced from the `primary` token
- a subtle `shadow-xs` elevation and hover feedback

You can override or extend the styles by targeting the `campfire-link` or `campfire-trigger` classes.
