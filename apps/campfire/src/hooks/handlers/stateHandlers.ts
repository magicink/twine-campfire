import { toString } from 'mdast-util-to-string'
import type { Parent } from 'mdast'
import type {
  DirectiveHandler,
  DirectiveHandlerResult
} from '@campfire/remark-campfire'
import {
  type DirectiveNode,
  ensureKey,
  extractKeyValue,
  extractAttributes,
  hasLabel,
  removeNode,
  applyKeyValue,
  isRange
} from '@campfire/utils/directiveUtils'
import { requireLeafDirective } from '@campfire/utils/directiveHandlerUtils'
import {
  getRandomInt,
  getRandomItem,
  parseNumericValue
} from '@campfire/utils/math'
import { parseTypedValue } from '@campfire/utils/directiveUtils'
import { extractQuoted } from '@campfire/utils/core'
import type { SetOptions, StateManagerType } from '@campfire/state/stateManager'

/**
 * Context required to create state and array directive handlers.
 */
export interface StateHandlerContext {
  /** Retrieves the current state manager. */
  getState: () => StateManagerType<Record<string, unknown>>
  /** Retrieves the latest game data snapshot. */
  getGameData: () => Record<string, unknown>
  /** Refreshes cached state snapshots after mutations. */
  refreshState: () => void
  /** Records an error message. */
  addError: (msg: string) => void
}

/**
 * Creates handlers for state and array directives.
 *
 * @param ctx - Context providing state access and utilities.
 * @returns An object containing directive handlers and helpers.
 */
export const createStateHandlers = (ctx: StateHandlerContext) => {
  const { getState, getGameData, refreshState, addError } = ctx

  /**
   * Parses a comma-separated list of items into typed values.
   *
   * @param raw - Raw comma-separated list string.
   * @returns Array of parsed values.
   */
  const parseItems = (raw: string): unknown[] => {
    const data = getGameData()
    return raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .flatMap(item => {
        const value = parseTypedValue(item, data)
        if (value === undefined) return [item]
        return Array.isArray(value) ? value : [value]
      })
  }

  /**
   * Retrieves a value from the current game state using dot notation.
   *
   * @param path - Dot separated path of the desired value.
   * @returns The value at the provided path or undefined.
   */
  const getValue = (path: string): unknown => getState().getValue(path)

  /**
   * Executes a mutator function and refreshes cached state snapshots.
   *
   * @param mutator - Function performing the mutation.
   */
  const withStateUpdate = (mutator: () => void) => {
    mutator()
    refreshState()
  }

  /**
   * Sets a value within the game state using dot notation.
   *
   * @param path - Dot separated path where the value should be stored.
   * @param value - The value to assign at the provided path.
   * @param opts - Additional options controlling assignment behavior.
   */
  const setValue = (path: string, value: unknown, opts: SetOptions = {}) =>
    withStateUpdate(() => getState().setValue(path, value, opts))

  /**
   * Removes a value from the game state using dot notation.
   *
   * @param path - Dot separated path of the value to remove.
   */
  const unsetValue = (path: string) =>
    withStateUpdate(() => getState().unsetValue(path))

  /**
   * Handles the leaf `set` and `setOnce` directives by assigning values to keys
   * in game data using shorthand `key=value` pairs.
   *
   * @param directive - The directive node being processed.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within the parent.
   * @param lock - When true, locks the key after setting it.
   * @returns The index of the removed node, if applicable.
   */
  const handleSet = (
    directive: DirectiveNode,
    parent: Parent | undefined,
    index: number | undefined,
    lock = false
  ): DirectiveHandlerResult => {
    const invalid = requireLeafDirective(directive, parent, index, addError)
    if (invalid !== undefined) return invalid
    const rawLabel = hasLabel(directive) ? directive.label : undefined
    const textContent = toString(directive)
    let shorthand: string | undefined
    if (rawLabel && rawLabel.includes('=')) {
      shorthand = rawLabel
    } else if (textContent && textContent.includes('=')) {
      shorthand = textContent.trim()
    }

    const safe: Record<string, unknown> = {}

    /**
     * Extracts and assigns values from shorthand `key=value` pairs placed in the
     * directive label.
     *
     * @param pair - The raw `key=value` string.
     */
    const applyShorthand = (pair: string) => {
      const eq = pair.indexOf('=')
      if (eq === -1) {
        const msg = `Malformed set directive: ${pair}`
        console.error(msg)
        addError(msg)
        return
      }
      const keyRaw = pair.slice(0, eq).trim()
      const valueRaw = pair.slice(eq + 1)
      const key = ensureKey(keyRaw, parent, index)
      if (!key) return
      const parsed = parseTypedValue(valueRaw, getGameData())
      if (parsed !== undefined) {
        safe[key] = parsed
      }
    }

    /**
     * Splits shorthand string into `key=value` pairs, allowing spaces within
     * expressions.
     *
     * @param input - The raw shorthand string.
     * @returns An array of `key=value` pairs.
     */
    const extractPairs = (input: string): string[] =>
      input.match(/\S+=\s*[^]+?(?=\s+\S+=|$)/g) || []

    if (shorthand) {
      for (const part of extractPairs(shorthand)) {
        applyShorthand(part)
      }
    }

    if (Object.keys(safe).length > 0) {
      for (const [k, v] of Object.entries(safe)) {
        setValue(k, v, { lock })
      }
    }

    if (parent && typeof index === 'number') {
      parent.children.splice(index, 1)
      return index
    }
  }

  /**
   * Parses and applies an array directive in the form `key=[...]`.
   * Supports basic type coercion and expression evaluation for each array item.
   *
   * @param directive - The directive node representing the array directive.
   * @param parent - Parent AST node containing this directive.
   * @param index - Index of the directive within its parent.
   * @param lock - When true, locks the key after setting its value.
   */
  const handleArray = (
    directive: DirectiveNode,
    parent: Parent | undefined,
    index: number | undefined,
    lock = false
  ): DirectiveHandlerResult => {
    const invalid = requireLeafDirective(directive, parent, index, addError)
    if (invalid !== undefined) return invalid
    const splitItems = (input: string): string[] => {
      const result: string[] = []
      let current = ''
      let depth = 0
      let quote: string | null = null
      for (let i = 0; i < input.length; i++) {
        const ch = input[i]
        if (quote) {
          // Count consecutive backslashes before the quote
          if (ch === quote) {
            let backslashCount = 0
            let j = i - 1
            while (j >= 0 && input[j] === '\\') {
              backslashCount++
              j--
            }
            if (backslashCount % 2 === 0) quote = null
          }
          current += ch
          continue
        }
        if (ch === '"' || ch === "'" || ch === '`') {
          quote = ch
          current += ch
          continue
        }
        if (ch === '[' || ch === '{' || ch === '(') {
          depth++
          current += ch
          continue
        }
        if (ch === ']' || ch === '}' || ch === ')') {
          depth--
          current += ch
          continue
        }
        if (ch === ',' && depth === 0) {
          result.push(current.trim())
          current = ''
          continue
        }
        current += ch
      }
      if (current.trim()) result.push(current.trim())
      return result
    }

    return applyKeyValue(directive, parent, index, {
      parse: (valueRaw, key) => {
        const quoted = extractQuoted(valueRaw)
        if (quoted !== undefined) return quoted
        if (!valueRaw.startsWith('[') || !valueRaw.endsWith(']')) {
          const msg = `Array directive value must be in [ ] notation: ${key}=${valueRaw}`
          console.error(msg)
          addError(msg)
          return []
        }
        try {
          const parsed = JSON.parse(valueRaw)
          if (Array.isArray(parsed)) return parsed
          throw new Error('not an array')
        } catch {
          const inner = valueRaw.slice(1, -1)
          return splitItems(inner).map(item =>
            parseTypedValue(item, getGameData())
          )
        }
      },
      setValue,
      onError: addError,
      lock
    })
  }

  /**
   * Shared flow for createRange and setRange directives.
   *
   * @param mode - Specifies whether to create or set a range.
   * @param directive - Directive node being processed.
   * @param parent - Parent AST node.
   * @param index - Index of the directive within its parent.
   * @returns The index of the removed node, if any.
   */
  const processRangeDirective = (
    mode: 'create' | 'set',
    directive: DirectiveNode,
    parent: Parent | undefined,
    index: number | undefined
  ): DirectiveHandlerResult => {
    const invalid = requireLeafDirective(directive, parent, index, addError)
    if (invalid !== undefined) return invalid
    const parsed = extractKeyValue(directive, parent, index, addError)
    if (!parsed) return index
    const { key, valueRaw } = parsed

    let lower: number
    let upper: number

    if (mode === 'create') {
      const { attrs, valid, errors } = extractAttributes(
        directive,
        parent,
        index,
        {
          min: { type: 'number', required: true },
          max: { type: 'number', required: true }
        },
        { state: getGameData() }
      )
      if (!valid) {
        for (const e of errors) {
          console.error(e)
          addError(e)
        }
        return index
      }
      lower = attrs.min as number
      upper = attrs.max as number
    } else {
      const current = getValue(key)
      if (!isRange(current)) {
        const msg = `setRange target is not a range: ${key}`
        console.error(msg)
        addError(msg)
        return index
      }
      lower = current.min
      upper = current.max
    }

    const value = parseNumericValue(parseTypedValue(valueRaw, getGameData()))
    withStateUpdate(() => getState().setRange(key, lower, upper, value))
    return removeNode(parent, index)
  }

  /**
   * Initializes a range value with specified bounds and starting value using
   * shorthand `key=value` notation.
   */
  const handleCreateRange: DirectiveHandler = (directive, parent, index) =>
    processRangeDirective('create', directive, parent, index)

  /**
   * Updates the value of an existing range, clamping it between its bounds.
   */
  const handleSetRange: DirectiveHandler = (directive, parent, index) =>
    processRangeDirective('set', directive, parent, index)

  /**
   * Stores a random value in the provided key. Supports selecting a random
   * item from an array or generating a random integer within a range.
   * Accepts either a `from` attribute or a `min`/`max` pair, but not both.
   * Optionally locks the key to prevent further modification.
   *
   * @param directive - The `random` directive node being processed.
   * @param parent - The parent AST node containing this directive.
   * @param index - The index of the directive within its parent.
   * @param lock - When true, locks the key after setting its value.
   */
  const handleRandom = (
    directive: DirectiveNode,
    parent: Parent | undefined,
    index: number | undefined,
    lock = false
  ): DirectiveHandlerResult => {
    const invalid = requireLeafDirective(directive, parent, index, addError)
    if (invalid !== undefined) return invalid
    const label = hasLabel(directive) ? directive.label : toString(directive)
    const key = ensureKey(label.trim(), parent, index)
    if (!key) return index

    const rawAttrs = (directive.attributes || {}) as Record<string, unknown>
    if ('from' in rawAttrs && ('min' in rawAttrs || 'max' in rawAttrs)) {
      const msg = 'random accepts either "from" or "min"/"max", not both'
      console.error(msg)
      addError(msg)
      return removeNode(parent, index)
    }

    const { attrs } = extractAttributes(
      directive,
      parent,
      index,
      {
        from: { type: 'array' },
        min: { type: 'number' },
        max: { type: 'number' }
      },
      { state: getGameData() }
    )

    let value: unknown
    const optionList = attrs.from as unknown[] | undefined
    const hasFrom = 'from' in attrs
    const hasMin = 'min' in attrs
    const hasMax = 'max' in attrs

    if (hasFrom) {
      if (optionList && optionList.length) {
        value = getRandomItem(optionList)
      } else {
        const msg = 'random "from" attribute must be a non-empty array'
        console.error(msg)
        addError(msg)
        return removeNode(parent, index)
      }
    } else if (hasMin || hasMax) {
      if (hasMin && hasMax) {
        const { min, max } = attrs as { min: number; max: number }
        value = getRandomInt(min, max)
      } else {
        const msg = 'random requires both "min" and "max" when "from" is absent'
        console.error(msg)
        addError(msg)
        return removeNode(parent, index)
      }
    } else {
      const msg = 'random requires either "from" or both "min" and "max"'
      console.error(msg)
      addError(msg)
      return removeNode(parent, index)
    }

    if (value !== undefined) {
      setValue(key, value, { lock })
    }

    const removed = removeNode(parent, index)
    if (typeof removed === 'number') return removed
  }

  /**
   * Creates a handler for array mutation directives.
   *
   * @param op - The array operation to perform.
   * @returns A directive handler implementing the requested operation.
   */
  const createArrayOperationHandler =
    (
      op: 'push' | 'pop' | 'shift' | 'unshift' | 'splice' | 'concat'
    ): DirectiveHandler =>
    (directive, parent, index) => {
      const invalid = requireLeafDirective(directive, parent, index, addError)
      if (invalid !== undefined) return invalid
      const attrs = directive.attributes || {}
      const key = ensureKey(
        (attrs as Record<string, unknown>).key,
        parent,
        index
      )
      if (!key) return index

      const arr = Array.isArray(getValue(key))
        ? [...(getValue(key) as unknown[])]
        : []
      const store = (attrs as Record<string, unknown>).into

      const parseValues = (): unknown[] => {
        const raw = (attrs as Record<string, unknown>).value
        return typeof raw === 'string' ? parseItems(raw) : []
      }

      switch (op) {
        case 'push': {
          const values = parseValues()
          if (values.length) {
            arr.push(...values)
            setValue(key, arr)
          }
          break
        }
        case 'unshift': {
          const values = parseValues()
          if (values.length) {
            arr.unshift(...values)
            setValue(key, arr)
          }
          break
        }
        case 'concat': {
          const values = parseValues()
          if (values.length) {
            const result = arr.concat(values)
            setValue(key, result)
          }
          break
        }
        case 'pop': {
          const value = arr.pop()
          setValue(key, arr)
          if (typeof store === 'string' && value !== undefined) {
            setValue(store, value)
          }
          break
        }
        case 'shift': {
          const value = arr.shift()
          setValue(key, arr)
          if (typeof store === 'string' && value !== undefined) {
            setValue(store, value)
          }
          break
        }
        case 'splice': {
          const parseNum = (value: unknown): number => {
            if (typeof value === 'string')
              return parseNumericValue(parseTypedValue(value, getGameData()))
            return parseNumericValue(value)
          }

          const start = parseNum((attrs as Record<string, unknown>).index)
          const count = parseNum((attrs as Record<string, unknown>).count)
          const values = parseValues()
          const removed = arr.splice(start, count, ...values)
          setValue(key, arr)
          if (typeof store === 'string') {
            setValue(store, removed)
          }
          break
        }
      }

      return removeNode(parent, index)
    }

  const handlePop = createArrayOperationHandler('pop')
  const handlePush = createArrayOperationHandler('push')
  const handleShift = createArrayOperationHandler('shift')
  const handleUnshift = createArrayOperationHandler('unshift')
  const handleSplice = createArrayOperationHandler('splice')
  const handleConcat = createArrayOperationHandler('concat')

  /**
   * Handles the `unset` directive by removing a value from the game state.
   *
   * @param directive - The directive node representing the unset directive.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within its parent.
   * @returns The index of the removed node, if any.
   */
  const handleUnset: DirectiveHandler = (directive, parent, index) => {
    const invalid = requireLeafDirective(directive, parent, index, addError)
    if (invalid !== undefined) return invalid
    const attrs = directive.attributes || {}
    const key = ensureKey(
      (attrs as Record<string, unknown>).key ??
        (hasLabel(directive) ? directive.label : toString(directive)),
      parent,
      index
    )
    if (!key) return index

    unsetValue(key)

    return removeNode(parent, index)
  }

  const handlers = {
    set: (d: DirectiveNode, p: Parent | undefined, i: number | undefined) =>
      handleSet(d, p, i, false),
    setOnce: (d: DirectiveNode, p: Parent | undefined, i: number | undefined) =>
      handleSet(d, p, i, true),
    array: (d: DirectiveNode, p: Parent | undefined, i: number | undefined) =>
      handleArray(d, p, i, false),
    arrayOnce: (
      d: DirectiveNode,
      p: Parent | undefined,
      i: number | undefined
    ) => handleArray(d, p, i, true),
    createRange: handleCreateRange,
    setRange: handleSetRange,
    random: handleRandom,
    randomOnce: (
      d: DirectiveNode,
      p: Parent | undefined,
      i: number | undefined
    ) => handleRandom(d, p, i, true),
    pop: handlePop,
    push: handlePush,
    shift: handleShift,
    unshift: handleUnshift,
    splice: handleSplice,
    concat: handleConcat,
    unset: handleUnset
  }

  return { handlers, setValue }
}
