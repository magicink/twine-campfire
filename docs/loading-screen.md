# Loading screen

Use the `LoadingScreen` component to preload assets and show progress before the first passage renders.

```tsx
import { LoadingScreen } from '@campfire/components/LoadingScreen'

const assets = [
  { type: 'audio', id: 'click', src: 'audio/click.wav' },
  { type: 'image', id: 'title', src: 'images/title.png' }
]

<LoadingScreen assets={assets} targetPassage='Intro' />
```

When all assets finish loading, the component advances to the given passage.

For directive syntax to preload assets manually, see [Asset management](directives/asset-management.md).
