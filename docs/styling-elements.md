# Styling elements

Campfire's visual components expose unstyled classes prefixed with `campfire-`, letting you theme the interface without having to override defaults. Common selectors include:

- `.campfire-campfire` – root story container
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

Each class ships with no associated styles. Customize them in your own stylesheet as needed.
