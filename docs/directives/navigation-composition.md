# Navigation & composition

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

  | Input          | Description                                                                |
  | -------------- | -------------------------------------------------------------------------- |
  | size           | Slide size as `WIDTHxHEIGHT` in pixels or aspect ratio like `16x9`         |
  | theme          | Optional JSON object or string of CSS properties applied to the deck theme |
  | from           | Name of a deck preset to apply before other attributes                     |
  | autoplay       | Whether to automatically advance through slides                            |
  | autoplayDelay  | Milliseconds between automatic slide advances (defaults to 3000)           |
  | pause          | Start autoplay paused and display a play button                            |
  | groupClassName | Additional classes applied to the slide group wrapper                      |
  | navClassName   | Additional classes applied to the navigation wrapper                       |
  | hudClassName   | Additional classes applied to the slide counter HUD wrapper                |

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
  | enterDelay    | Enter transition delay in ms        |
  | exitDelay     | Exit transition delay in ms         |
  | enterEasing   | Enter transition easing             |
  | exitEasing    | Exit transition easing              |
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

- `layer`: Absolutely position arbitrary content within a slide.

  ```md
  :::deck
  :::slide
  :::layer{x=10 y=20 w=100 h=50 className="bg-[var(--color-primary-500)]"}
  Content
  :::
  :::
  ```

  | Input     | Description                              |
  | --------- | ---------------------------------------- |
  | x         | Horizontal position in pixels            |
  | y         | Vertical position in pixels              |
  | w         | Width in pixels                          |
  | h         | Height in pixels                         |
  | z         | z-index value                            |
  | rotate    | Rotation in degrees                      |
  | scale     | Scale multiplier                         |
  | anchor    | Transform origin (`top-left` by default) |
  | className | Additional classes applied to the Layer  |
  | from      | Name of a layer preset to apply          |

- `text`: Position typographic content within a slide.

  ```md
  :::deck
  :::slide
  :::text{x=100 y=50 align=center size=32 style="color: var(--color-primary-500)"}
  Hello
  :::
  :::
  ```

  Supports a `from` attribute to apply presets and uses `layerClassName` to add classes to the Layer wrapper.

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
  | align          | Horizontal text alignment                |
  | size           | Font size in pixels                      |
  | weight         | Font weight                              |
  | lineHeight     | Line height multiplier                   |
  | color          | Text color                               |
  | style          | Inline styles applied to the text node   |
  | className      | Classes applied to the text node         |
  | layerClassName | Classes applied to the Layer wrapper     |
  | from           | Name of a text preset to apply           |

- `shape`: Draw basic shapes within a slide.

  ```md
  :::deck
  :::slide
  :shape{type='rect' x=10 y=20 w=100 h=50}
  :::
  :::
  ```

  | Input          | Description                                       |
  | -------------- | ------------------------------------------------- |
  | x              | Horizontal position in pixels                     |
  | y              | Vertical position in pixels                       |
  | w              | Width in pixels                                   |
  | h              | Height in pixels                                  |
  | z              | z-index value                                     |
  | rotate         | Rotation in degrees                               |
  | scale          | Scale multiplier                                  |
  | anchor         | Transform origin (`top-left` by default)          |
  | type           | Shape type (`rect`, `ellipse`, `line`, `polygon`) |
  | points         | Points for polygon shapes                         |
  | x1             | Starting x-coordinate for line shapes             |
  | y1             | Starting y-coordinate for line shapes             |
  | x2             | Ending x-coordinate for line shapes               |
  | y2             | Ending y-coordinate for line shapes               |
  | stroke         | Stroke color                                      |
  | strokeWidth    | Stroke width in pixels                            |
  | fill           | Fill color (`none` by default)                    |
  | radius         | Corner radius for rectangles                      |
  | shadow         | Adds a drop shadow when true                      |
  | className      | Classes applied to the `<svg>` element            |
  | layerClassName | Classes applied to the Layer wrapper              |
  | style          | Inline styles applied to the `<svg>` element      |
  | from           | Name of a shape preset to apply                   |

- `preset`: Define reusable attribute sets that can be applied via the `from` attribute on `deck`, `reveal`, `image`, `shape`, and `text` directives.

  ```md
  :preset{type="deck" name="wide" size="16x9"}
  :preset{type="text" name="title" x=100 y=50 size=32 color="var(--color-gray-200)"}

  :::deck{from="wide"}
  :::slide
  :::text{from="title"}
  Welcome
  :::
  :::
  ```

  Presets allow authors to reuse common configurations across multiple directives.
