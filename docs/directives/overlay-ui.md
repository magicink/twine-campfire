# Overlay UI Passages

Authors can create persistent UI elements by tagging passages with `overlay`.
These passages are processed once at initialization and rendered on top of all
other passages.

## Creating an Overlay Passage

1. Add a Twine passage with a unique `name`.
2. Include the tag `overlay` (case-insensitive).
3. Optionally add `overlay-z{n}` to control stacking order or
   `overlay-group-{name}` to group related overlays.
4. Use directives such as `deck`, `layer`, `text`, `image`, or `shape` to
   position content. The `layer` directive accepts `x`, `y`, `w`, `h`, `z`, and
   other attributes for absolute positioning.
5. Control visibility with `show` or `if` directives based on game state.

Overlay passages persist across navigation and should avoid directives like
`goto` that change the current passage.

## Toggling Overlays

Use the overlay store helpers to control overlay visibility:

```ts
import { useOverlayStore } from '@campfire/state/useOverlayStore'

// Hide or show a single overlay by name
useOverlayStore.getState().toggleOverlay('hud')

// Toggle all overlays in a group
useOverlayStore.getState().toggleGroup('menu')
```

Each overlay uses an independent deck store, so slide-based overlays retain
their state when navigating between passages.
