# Images

Preload images so they're cached before display.

- `preloadImage`: Preload an image for later use.

  ```md
  :preloadImage[titleScreen]{src='images/title.png'}
  ```

  | Attribute | Description                     |
  | --------- | ------------------------------- |
  | `src`     | URL of the image file           |
  | `id`      | Unique identifier for the image |

Wrap string values in matching quotes or backticks. Unquoted values are treated as state keys when applicable.
