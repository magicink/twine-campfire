# Arrays & collection management

Create or modify lists of values.

> Only use these directives for arrays—JavaScript's built-in methods can lead
> to unpredictable behavior.

- `array`: Create an array.

  ```md
  :array[items=[1,2,'three',"four"]]
  ```

  Replace `items` with the array name. The directive accepts a single
  `key=[...]` pair where the value is in array notation. Items are
  automatically converted to strings, numbers, or booleans and may include
  expressions evaluated against the current state.

  | Input | Description                      |
  | ----- | -------------------------------- |
  | key   | Name of the array to create      |
  | [...] | Initial values in array notation |

- `arrayOnce`: Create an array only if it has not been set.

  ```md
  :arrayOnce[visited=['FOREST',"CAVE"]]
  ```

  This behaves like `array` but locks the key after execution, preventing
  further changes.

  | Input | Description                      |
  | ----- | -------------------------------- |
  | key   | Name of the array to create      |
  | [...] | Initial values in array notation |

- `concat`: Combine arrays.

  ```md
  :concat{key=items value=moreItems}
  ```

  Replace `items` with the target array and `moreItems` with the source.

  | Input | Description                    |
  | ----- | ------------------------------ |
  | key   | Target array to modify         |
  | value | Array whose items are appended |

- `pop`: Remove the last item. Use `into` to store it.

  ```md
  :pop{key=items into=lastItem}
  ```

  Replace `items` with the array and `lastItem` with the storage key.

  | Input | Description                            |
  | ----- | -------------------------------------- |
  | key   | Array to modify                        |
  | into  | Optional key to store the removed item |

- `push`: Add items to the end of an array.

  ```md
  :push{key=items value=newItem}
  ```

  Replace `items` with the array and `newItem` with items to add.

  | Input | Description     |
  | ----- | --------------- |
  | key   | Array to modify |
  | value | Items to append |

- `shift`: Remove the first item. Use `into` to store it.

  ```md
  :shift{key=items into=firstItem}
  ```

  Replace `items` with the array and `firstItem` with the storage key.

  | Input | Description                            |
  | ----- | -------------------------------------- |
  | key   | Array to modify                        |
  | into  | Optional key to store the removed item |

- `splice`: Remove items at an index and optionally insert new ones. Use `into`
  to store removed items.

  ```md
  :splice{key=items index=value count=value into=removedItems}
  ```

  Replace `items` with the array and adjust attributes as needed.

  | Input | Description                         |
  | ----- | ----------------------------------- |
  | key   | Array to modify                     |
  | index | Starting index for removal          |
  | count | Number of items to remove           |
  | value | Items to insert                     |
  | into  | Optional key to store removed items |

- `unshift`: Add items to the start of an array.

  ```md
  :unshift{key=items value=newItem}
  ```

  Replace `items` with the array and `newItem` with items to add.

  | Input | Description      |
  | ----- | ---------------- |
  | key   | Array to modify  |
  | value | Items to prepend |
