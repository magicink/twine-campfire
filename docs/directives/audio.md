# Audio

Play sound effects and music.

- `preloadAudio`: Preload an audio file for later use.

  ```md
  :preloadAudio[click]{src='audio/click.wav'}
  ```

  | Attribute | Description                    |
  | --------- | ------------------------------ |
  | `src`     | URL of the audio file          |
  | `id`      | Unique identifier for the clip |

- `sound`: Play a one-off sound effect.

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

- `bgm`: Control background music. Use `stop=true` to stop.

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

- `volume`: Set global volume levels.

  ```md
  :volume{bgm=0.2 sfx=0.8}
  ```

  | Attribute | Description                      |
  | --------- | -------------------------------- |
  | `bgm`     | Background music volume from 0–1 |
  | `sfx`     | Sound effects volume from 0–1    |

Wrap string values in matching quotes or backticks. Unquoted values are treated as state keys when applicable.
