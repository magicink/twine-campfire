# Navigation, composition & transitions

Control the flow between passages or how they reveal.

- `goto`: Jump to another passage.

  ```md
  :goto["PASSAGE-NAME"]
  ```

  Use quotes or backticks for passage names. Unquoted numbers navigate by pid.
  When using the `passage` attribute, unquoted strings are treated as keys in the
  game state.

  | Input   | Description                            |
  | ------- | -------------------------------------- |
  | passage | Target passage name, pid, or state key |

- `include`: Embed another passage's content.

  ```md
  :include["PASSAGE-NAME"]
  ```

  Use quotes or backticks for passage names. Unquoted numbers include by pid.
  When using the `passage` attribute, unquoted strings are treated as keys in the
  game state. Nested includes are limited to 10 levels to prevent infinite loops.

  | Input   | Description                                |
  | ------- | ------------------------------------------ |
  | passage | Passage name, pid, or state key to include |

- `title`: Set the document title.

  ```md
  :title["GAME-TITLE"]
  ```

  Replace `GAME-TITLE` with the text to display, wrapped in matching quotes or backticks.

  By default, the browser tab displays the story name and current passage name
  separated by a colon. Customize this behavior by adding attributes to the
  `<tw-storydata>` element:
  - `title-separator`: String placed between the story and passage names.
  - `title-show-passage="false"`: Hide the passage name and show only the
    story name.

  | Input | Description                         |
  | ----- | ----------------------------------- |
  | text  | Title text displayed in the browser |

- `deck`: Present content as a series of slides.

  ```md
  :::deck{size='16x9' transition='slide'}
  :::slide{transition='fade'}

  # One

  :::
  :::slide

  ## Two

  :::
  :::
  ```

  Each `:::slide` starts a new slide. Plain Markdown inside the deck becomes
  its own slide if not preceded by a slide directive.

  | Input         | Description                                                                |
  | ------------- | -------------------------------------------------------------------------- |
  | size          | Slide size as `WIDTHxHEIGHT` in pixels or aspect ratio like `16x9`         |
  | theme         | Optional JSON object or string of CSS properties applied to the deck theme |
  | from          | Name of a deck preset to apply before other attributes                     |
  | autoplay      | Whether to automatically advance through slides                            |
  | autoplayDelay | Milliseconds between automatic slide advances (defaults to 3000)           |
  | pause         | Start autoplay paused and display a play button                            |

- `slide`: Customize an individual slide.

  ```md
  :::deck
  :::slide{enter="slide" exit="fade"}
  Content
  :::
  :::
  ```

  | Input         | Description                         |
  | ------------- | ----------------------------------- |
  | enter         | Enter transition type               |
  | exit          | Exit transition type                |
  | enterDir      | Enter transition direction          |
  | exitDir       | Exit transition direction           |
  | enterDuration | Enter transition duration in ms     |
  | exitDuration  | Exit transition duration in ms      |
  | steps         | Number of build steps on this slide |
  | onEnter       | Directive block to run on enter     |
  | onExit        | Directive block to run on exit      |
  | from          | Name of a slide preset to apply     |

- `reveal`: Reveal slide content step-by-step.

  ```md
  :::deck
  :::slide
  :::reveal{at=0}
  :::text{x=80 y=80}
  First
  :::
  :::
  :::reveal{at=1}
  :::text{x=80 y=120}
  Second
  :::
  :::
  :::
  ```

  | Input             | Description                          |
  | ----------------- | ------------------------------------ |
  | at                | Deck step when content reveals       |
  | exitAt            | Deck step when content hides         |
  | enter             | Enter transition type                |
  | exit              | Exit transition type                 |
  | enterDir          | Enter transition direction           |
  | exitDir           | Exit transition direction            |
  | enterDuration     | Enter transition duration in ms      |
  | exitDuration      | Exit transition duration in ms       |
  | interruptBehavior | How to handle interrupted animations |
  | from              | Name of a reveal preset to apply     |

- `text`: Position typographic content within a slide.

  ```md
  :::deck
  :::slide
  :::text{x=100 y=50 align=center size=32}
  Hello
  :::
  :::
  ```

  Accepts the same attributes as the `Text` component, supports a `from` attribute to apply presets, and uses `layerClassName` to add classes to the Layer wrapper.

- `image`: Position an image within a slide.

  ```md
  :::deck
  :::slide
  :image{src='https://example.com/cat.png' x=10 y=20}
  :::
  :::
  ```

  Accepts the same attributes as the `SlideImage` component, supports a `from` attribute to apply presets, and uses `layerClassName` to add classes to the Layer wrapper.

- `shape`: Draw basic shapes within a slide.

  ```md
  :::deck
  :::slide
  :shape{type='rect' x=10 y=20 w=100 h=50}
  :::
  :::
  ```

  Accepts the same attributes as the `SlideShape` component, supports a `from` attribute to apply presets, and uses `layerClassName` to add classes to the Layer wrapper.

- `preset`: Define reusable attribute sets that can be applied via the `from` attribute on `deck`, `reveal`, `image`, `shape`, and `text` directives.

  ```md
  :preset{type="deck" name="wide" size="16x9"}
  :preset{type="text" name="title" x=100 y=50 size=32 color="#333"}

  :::deck{from="wide"}
  :::slide
  :::text{from="title"}
  Welcome
  :::
  :::
  ```

  Presets allow authors to reuse common configurations across multiple directives.

## Transitions

Transitions are available on the `deck`, `slide`, and `reveal` directives.

| Type  | Attributes                                             |
| ----- | ------------------------------------------------------ |
| fade  | `enterDuration`, `exitDuration`                        |
| slide | `enterDir`, `exitDir`, `enterDuration`, `exitDuration` |
| zoom  | `enterDuration`, `exitDuration`                        |
| flip  | `enterDuration`, `exitDuration`                        |
| none  | _(none)_                                               |

Flip transitions rotate elements in 3D and automatically apply a CSS perspective to the parent container for proper depth rendering.
