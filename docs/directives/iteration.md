# Iteration

Repeat blocks for each item in a collection.

- `for`: Render content for every element in an array or range.

  ```md
  :::for[item in [1,2,3]]
  Item: :show[item]
  :::
  ```

  With ranges:

  ```md
  :createRange[r=0]{min=1 max=3}
  :::for[x in r]
  Number: :show[x]
  :::
  ```

  Renders nothing for empty iterables.

  | Input      | Description                            |
  | ---------- | -------------------------------------- |
  | variable   | Name assigned to each item             |
  | expression | Array or range evaluated against state |
