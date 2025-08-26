# Images

Position images within slides and preload them to avoid display delays.

- `image`: Position an image within a slide.

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

- `preloadImage`: Preload an image for later use.

  ```md
  :preloadImage[titleScreen]{src='images/title.png'}
  ```

  | Attribute | Description                     |
  | --------- | ------------------------------- |
  | `src`     | URL of the image file           |
  | `id`      | Unique identifier for the image |

Wrap string values in matching quotes or backticks. Unquoted values are treated as state keys when applicable.
