# Asset management

Manage image and audio assets. Position images within slides and preload them or audio clips to avoid delays.

## Images

### `image`

Position an image within a slide.

```md
:::deck
:::slide
:image{src='https://example.com/cat.png' x=10 y=20}
:::
:::
```

Supports a `from` attribute to apply presets.

| Input          | Description                              |
| -------------- | ---------------------------------------- |
| x              | Horizontal position in pixels            |
| y              | Vertical position in pixels              |
| w              | Width in pixels                          |
| h              | Height in pixels                         |
| z              | z-index value                            |
| rotate         | Rotation in degrees                      |
| scale          | Scale multiplier                         |
| anchor         | Transform origin (`top-left` by default) |
| src            | Image source URL                         |
| alt            | Alternate text description               |
| style          | Inline styles applied to the `<img>`     |
| className      | Classes applied to the `<img>`           |
| layerClassName | Classes applied to the Layer wrapper     |
| from           | Name of an image preset to apply         |

### `preloadImage`

Preload an image for later use.

```md
:preloadImage[titleScreen]{src='images/title.png'}
```

| Attribute | Description                     |
| --------- | ------------------------------- |
| `src`     | URL of the image file           |
| `id`      | Unique identifier for the image |

## Audio

### `preloadAudio`

Preload an audio file for later use.

```md
:preloadAudio[click]{src='audio/click.wav'}
```

| Attribute | Description                    |
| --------- | ------------------------------ |
| `src`     | URL of the audio file          |
| `id`      | Unique identifier for the clip |

### `sound`

Play a one-off sound effect.

```md
:sound[click]{volume=0.5 delay=200}
```

| Attribute | Description                         |
| --------- | ----------------------------------- |
| `id`      | Name of a preloaded track           |
| `src`     | URL of the audio file               |
| `volume`  | Volume level from 0–1               |
| `delay`   | Milliseconds to wait before playing |
| `rate`    | Playback speed                      |

### `bgm`

Control background music. Use `stop=true` to stop.

```md
:bgm[forest]{volume=0.4 loop=true fade=1000}
:bgm{stop=true fade=500}
```

| Attribute | Description                                    |
| --------- | ---------------------------------------------- |
| `id`      | Name of a preloaded track                      |
| `src`     | URL of the audio file                          |
| `volume`  | Volume level from 0–1                          |
| `loop`    | Whether the track should loop (default `true`) |
| `fade`    | Milliseconds to cross-fade between tracks      |
| `stop`    | Stop the current background music when `true`  |

### `volume`

Set global volume levels.

```md
:volume{bgm=0.2 sfx=0.8}
```

| Attribute | Description                      |
| --------- | -------------------------------- |
| `bgm`     | Background music volume from 0–1 |
| `sfx`     | Sound effects volume from 0–1    |

Wrap string values in matching quotes or backticks. Unquoted values are treated as state keys when applicable.
