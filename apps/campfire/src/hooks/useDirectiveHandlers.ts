import { useEffect, useMemo, useRef } from 'preact/hooks'
import i18next from 'i18next'
import { SKIP } from 'unist-util-visit'
import { compile } from 'expression-eval'
import { toString } from 'mdast-util-to-string'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import type {
  DirectiveHandler,
  DirectiveHandlerResult
} from '@campfire/remark-campfire'
import remarkCampfire, {
  remarkCampfireIndentation
} from '@campfire/remark-campfire'
import type { Parent, Root, RootContent, Text as MdText } from 'mdast'
import type { Node } from 'unist'
import type {
  Element,
  ElementContent,
  Properties,
  Text as HastText
} from 'hast'
import type { ContainerDirective } from 'mdast-util-directive'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { type Checkpoint, useGameStore } from '@campfire/state/useGameStore'
import { markTitleOverridden } from '@campfire/state/titleState'
import {
  type DirectiveNode,
  type ExtractedAttrs,
  ensureKey,
  extractAttributes,
  getLabel,
  getRandomInt,
  getRandomItem,
  isRange,
  parseNumericValue,
  removeNode,
  stripLabel
} from '@campfire/remark-campfire/helpers'
import {
  parseTypedValue,
  extractKeyValue,
  replaceWithIndentation,
  expandIndentedCode,
  applyKeyValue
} from '@campfire/helpers'
import { DEFAULT_DECK_HEIGHT, DEFAULT_DECK_WIDTH } from '@campfire/constants'
import { getTranslationOptions } from '@campfire/utils/i18n'
import {
  createStateManager,
  type SetOptions
} from '@campfire/state/stateManager'

const QUOTE_PATTERN = /^(['"`])(.*)\1$/
const NUMERIC_PATTERN = /^\d+$/
const ALLOWED_ONEXIT_DIRECTIVES = new Set([
  'set',
  'setOnce',
  'array',
  'arrayOnce',
  'createRange',
  'setRange',
  'unset',
  'random',
  'randomOnce',
  'if',
  'batch'
])
const ALLOWED_BATCH_DIRECTIVES = new Set(
  [...ALLOWED_ONEXIT_DIRECTIVES].filter(name => name !== 'batch')
)
const BANNED_BATCH_DIRECTIVES = new Set(['batch'])

/** Marker inserted to close directive blocks. */
const DIRECTIVE_MARKER = ':::'

/**
 * When both parsed dimensions are less than or equal to this threshold, the
 * value is treated as an aspect ratio instead of explicit pixel dimensions.
 */
const ASPECT_RATIO_THRESHOLD = 100

/**
 * Determines whether a directive node includes a string label.
 *
 * @param node - Directive node to examine.
 * @returns True if the node has a label.
 */
const hasLabel = (
  node: DirectiveNode
): node is DirectiveNode & { label: string } =>
  typeof (node as { label?: unknown }).label === 'string'

export const useDirectiveHandlers = () => {
  let state = createStateManager<Record<string, unknown>>()
  let gameData = state.getState()
  let lockedKeys = state.getLockedKeys()
  let onceKeys = state.getOnceKeys()

  /**
   * Marks a key so associated blocks run only once.
   *
   * @param key - Identifier to mark as executed.
   */
  const markOnce = (key: string) => {
    state.markOnce(key)
    onceKeys = state.getOnceKeys()
  }
  const saveCheckpoint = useGameStore(state => state.saveCheckpoint)
  const removeCheckpoint = useGameStore(state => state.removeCheckpoint)
  const loadCheckpointFn = useGameStore(state => state.loadCheckpoint)
  const setLoading = useGameStore(state => state.setLoading)
  const addError = useGameStore(state => state.addError)
  const currentPassageId = useStoryDataStore(state => state.currentPassageId)
  const setCurrentPassage = useStoryDataStore(state => state.setCurrentPassage)
  const getPassageById = useStoryDataStore(state => state.getPassageById)
  const getPassageByName = useStoryDataStore(state => state.getPassageByName)
  const handlersRef = useRef<Record<string, DirectiveHandler>>({})
  const checkpointIdRef = useRef<string | null>(null)
  const checkpointErrorRef = useRef(false)
  const onExitSeenRef = useRef(false)
  const onExitErrorRef = useRef(false)
  const lastPassageIdRef = useRef<string | undefined>(undefined)

  const MAX_INCLUDE_DEPTH = 10
  let includeDepth = 0

  /**
   * Processes a block of AST nodes using the remarkCampfire plugin and returns
   * the transformed children. This ensures nested directives are fully
   * expanded and directive markers removed.
   *
   * @param nodes - An array of RootContent nodes to process.
   * @returns The processed array of nodes.
   */
  const runBlock = (nodes: RootContent[]): RootContent[] => {
    const root: Root = { type: 'root', children: expandIndentedCode(nodes) }
    unified()
      .use(remarkCampfireIndentation)
      .use(remarkCampfire, { handlers: handlersRef.current })
      .runSync(root)
    return root.children as RootContent[]
  }

  /**
   * Preprocesses directive children to handle fallback attributes before validation.
   * Runs the remarkCampfire plugin without handlers so only attribute parsing occurs.
   *
   * @param nodes - Directive child nodes to preprocess.
   * @returns The mutated array of child nodes.
   */
  const preprocessBlock = (nodes: RootContent[]): RootContent[] => {
    const root: Root = {
      type: 'root',
      children: expandIndentedCode(nodes)
    }
    unified().use(remarkCampfireIndentation).use(remarkCampfire).runSync(root)
    return root.children as RootContent[]
  }

  /**
   * Resets per-passage directive state such as checkpoints and onExit usage.
   * Clears existing checkpoint identifiers and error flags, resets OnExit tracking,
   * and updates the last processed passage identifier.
   */
  const resetDirectiveState = () => {
    checkpointIdRef.current = null
    checkpointErrorRef.current = false
    onExitSeenRef.current = false
    onExitErrorRef.current = false
    lastPassageIdRef.current = currentPassageId
  }

  useEffect(() => {
    resetDirectiveState()
  }, [currentPassageId])

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
      const parsed = parseTypedValue(valueRaw, gameData)
      if (typeof parsed !== 'undefined') {
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
          return splitItems(inner).map(item => parseTypedValue(item, gameData))
        }
      },
      setValue,
      onError: addError,
      lock
    })
  }

  /**
   * Evaluates a raw string to a numeric value using game data context.
   *
   * @param raw - Raw value string from the directive.
   * @param data - Game state used for expression evaluation.
   * @returns Parsed numeric value.
   */
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
        { state: gameData }
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

    const value = parseNumericValue(parseTypedValue(valueRaw, gameData))
    withStateUpdate(() => state.setRange(key, lower, upper, value))
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
   * Inserts a Show component that displays the value for the provided key.
   *
   * @param directive - The directive node representing the show directive.
   * @param parent - The parent AST node containing this directive.
   * @param index - The index of the directive node within its parent.
   */
  const handleShow: DirectiveHandler = (directive, parent, index) => {
    const key = ensureKey(toString(directive), parent, index)
    if (!key) return index
    const node: MdText = {
      type: 'text',
      value: '',
      data: {
        hName: 'show',
        hProperties: { 'data-key': key }
      }
    }
    if (parent && typeof index === 'number') {
      return replaceWithIndentation(directive, parent, index, [node])
    }
    return index
  }

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
      { state: gameData }
    )

    let value: unknown
    const optionList = attrs.from as unknown[] | undefined
    const hasFrom = typeof attrs.from !== 'undefined'
    const hasMin = typeof attrs.min !== 'undefined'
    const hasMax = typeof attrs.max !== 'undefined'

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

  const parseItems = (raw: string): unknown[] =>
    raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .flatMap(item => {
        const value = parseTypedValue(item, gameData)
        if (value === undefined) return [item]
        return Array.isArray(value) ? value : [value]
      })

  /**
   * Retrieves a value from the current game state using dot notation.
   *
   * @param path - Dot separated path of the desired value.
   * @returns The value at the provided path or undefined.
   */
  const getValue = (path: string): unknown => state.getValue(path)

  /**
   * Executes a mutator function and refreshes cached state snapshots.
   *
   * @param mutator - Function performing the mutation.
   */
  const withStateUpdate = (mutator: () => void) => {
    mutator()
    gameData = state.getState()
    lockedKeys = state.getLockedKeys()
    onceKeys = state.getOnceKeys()
  }

  /**
   * Sets a value within the game state using dot notation.
   *
   * @param path - Dot separated path where the value should be stored.
   * @param value - The value to assign at the provided path.
   * @param opts - Additional options controlling assignment behavior.
   */
  const setValue = (path: string, value: unknown, opts: SetOptions = {}) =>
    withStateUpdate(() => state.setValue(path, value, opts))

  /**
   * Removes a value from the game state using dot notation.
   *
   * @param path - Dot separated path of the value to remove.
   */
  const unsetValue = (path: string) =>
    withStateUpdate(() => state.unsetValue(path))

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
              return parseNumericValue(parseTypedValue(value, gameData))
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

  const handleUnset: DirectiveHandler = (directive, parent, index) => {
    const attrs = directive.attributes || {}
    const key = ensureKey(
      (attrs as Record<string, unknown>).key ?? toString(directive),
      parent,
      index
    )
    if (!key) return index

    unsetValue(key)

    return removeNode(parent, index)
  }

  /**
   * Determines whether the provided node is a Markdown text node.
   *
   * @param node - The AST node to check.
   * @returns Whether the node is an `MdText` node.
   */
  const isTextNode = (node: RootContent): node is MdText => node.type === 'text'

  /**
   * Removes a paragraph containing only directive markers from the parent.
   * Supports multiple markers separated by whitespace or collapsed together.
   *
   * @param parent - The parent node that may contain the marker.
   * @param index - The index of the potential marker node.
   */
  const removeDirectiveMarker = (parent: Parent, index: number) => {
    const marker = parent.children[index]
    if (!marker || marker.type !== 'paragraph') return
    if (marker.children.length > 0 && marker.children.every(isTextNode)) {
      const combined = marker.children
        .map(child => (child as MdText).value)
        .join('')
        .trim()
      const stripped = combined.replace(/\s+/g, '')
      const parts = stripped.split(DIRECTIVE_MARKER) // ensure only marker tokens remain
      if (stripped.length > 0 && parts.every(part => part === '')) {
        parent.children.splice(index, 1)
      }
    }
  }

  /**
   * Serializes `:::if` directive blocks into `<if>` components that
   * evaluate a test expression against game data and render optional
   * fallback content when the expression is falsy.
   */
  const handleIf: DirectiveHandler = (directive, parent, index) => {
    if (!parent || typeof index !== 'number') return
    const container = directive as ContainerDirective
    const children = container.children as RootContent[]
    let expr = getLabel(container) || ''
    if (!expr) {
      const attrs = container.attributes || {}
      const [firstKey, firstValue] = Object.entries(attrs)[0] || []
      if (firstKey) {
        if (firstValue === '' || typeof firstValue === 'undefined') {
          expr = firstKey
        } else {
          const valStr = String(firstValue).trim()
          const valueExpr =
            valStr === 'true' ||
            valStr === 'false' ||
            /^-?\d+(?:\.\d+)?$/.test(valStr)
              ? valStr
              : JSON.stringify(valStr)
          expr = `${firstKey}==${valueExpr}`
        }
      }
    }
    const elseIndex = children.findIndex(
      child =>
        child.type === 'containerDirective' &&
        (child as ContainerDirective).name === 'else'
    )
    const elseSiblingIndex = parent.children.findIndex(
      (child, i) =>
        i > index &&
        child.type === 'containerDirective' &&
        (child as ContainerDirective).name === 'else'
    )
    let fallbackNodes: RootContent[] | undefined
    let main = children
    if (elseIndex !== -1) {
      const next = children[elseIndex] as ContainerDirective
      main = children.slice(0, elseIndex)
      fallbackNodes = next.children as RootContent[]
    } else if (elseSiblingIndex !== -1) {
      const next = parent.children[elseSiblingIndex] as ContainerDirective
      fallbackNodes = next.children as RootContent[]
      const markerIndex = removeNode(parent, elseSiblingIndex)
      if (typeof markerIndex === 'number') {
        removeDirectiveMarker(parent, markerIndex)
      }
    }
    /**
     * Strips directive labels, runs preprocessing and removes empty text nodes.
     *
     * @param nodes - Nodes to prepare for serialization.
     * @returns Cleaned array without whitespace-only text nodes.
     */
    const processNodes = (nodes: RootContent[]): RootContent[] => {
      const cloned = stripLabel(nodes).map(node => structuredClone(node))
      return preprocessBlock(cloned).filter(
        node => !(isTextNode(node) && node.value.trim() === '')
      )
    }
    const content = JSON.stringify(processNodes(main))
    const fallback = fallbackNodes
      ? JSON.stringify(processNodes(fallbackNodes))
      : undefined
    const node: Parent = {
      type: 'paragraph',
      children: [],
      data: {
        hName: 'if',
        hProperties: fallback
          ? { test: expr, content, fallback }
          : { test: expr, content }
      }
    }
    const newIndex = replaceWithIndentation(directive, parent, index, [
      node as RootContent
    ])
    const markerIndex = newIndex + 1
    removeDirectiveMarker(parent, markerIndex)
    return [SKIP, newIndex]
  }

  /**
   * Inlines the children of `:::else` directives when present.
   */
  const handleElse: DirectiveHandler = (directive, parent, index) => {
    if (!parent || typeof index !== 'number') return
    const container = directive as ContainerDirective
    const content = stripLabel(container.children as RootContent[])
    const newIndex = replaceWithIndentation(directive, parent, index, content)
    const markerIndex = newIndex + content.length
    removeDirectiveMarker(parent, markerIndex)
    const offset = content.length > 0 ? content.length - 1 : 0
    return [SKIP, newIndex + offset]
  }

  /**
   * Processes `:::once` blocks so their contents run only once per key.
   *
   * @param directive - The `once` directive node.
   * @param parent - The directive's parent in the AST.
   * @param index - Index of the directive within its parent.
   * @returns Visitor instructions after processing the directive.
   */
  const handleOnce: DirectiveHandler = (directive, parent, index) => {
    if (!parent || typeof index !== 'number') return
    const container = directive as ContainerDirective
    const attrs = container.attributes || {}
    const key = ensureKey(
      (attrs as Record<string, unknown>).key ??
        (getLabel(container) || Object.keys(attrs)[0]),
      parent,
      index
    )
    if (!key) return [SKIP, index]
    if (onceKeys[key]) {
      const markerIndex = removeNode(parent, index)
      if (typeof markerIndex === 'number') {
        removeDirectiveMarker(parent, markerIndex)
        return [SKIP, markerIndex]
      }
      return [SKIP, index]
    }
    markOnce(key)
    const content = stripLabel(container.children as RootContent[])
    const newIndex = replaceWithIndentation(directive, parent, index, content)
    return [SKIP, newIndex + Math.max(0, content.length - 1)]
  }
  /**
   * Executes a block of directives against a temporary state and commits
   * the resulting changes in a single update.
   * Only data directives are allowed; nested batch directives are not supported.
   */
  const handleBatch: DirectiveHandler = (directive, parent, index) => {
    if (!parent || typeof index !== 'number') return
    if (
      parent.type === 'containerDirective' &&
      (parent as ContainerDirective).name === 'batch'
    ) {
      const msg = 'Nested batch directives are not allowed'
      console.error(msg)
      addError(msg)
      removeNode(parent, index)
      return [SKIP, index]
    }

    const container = directive as ContainerDirective
    const allowed = ALLOWED_BATCH_DIRECTIVES
    const rawChildren = stripLabel(container.children as RootContent[])
    const processedChildren = preprocessBlock(rawChildren)
    const [filtered, invalid, nested] = filterDirectiveChildren(
      processedChildren,
      allowed,
      BANNED_BATCH_DIRECTIVES
    )
    if (nested) {
      const msg = 'Nested batch directives are not allowed'
      console.error(msg)
      addError(msg)
    }
    if (invalid) {
      const allowedList = [...allowed].join(', ')
      const msg = `batch only supports directives: ${allowedList}`
      console.error(msg)
      addError(msg)
    }

    const scoped = state.createScope()
    const prevState = state
    state = scoped
    gameData = scoped.getState()
    lockedKeys = scoped.getLockedKeys()
    onceKeys = scoped.getOnceKeys()

    runBlock(filtered)

    const changes = scoped.getChanges()
    state = prevState
    state.applyChanges(changes)
    gameData = state.getState()
    lockedKeys = state.getLockedKeys()
    onceKeys = state.getOnceKeys()

    removeNode(parent, index)
    return [SKIP, index]
  }

  const handleTrigger: DirectiveHandler = (directive, parent, index) => {
    if (!parent || typeof index !== 'number') return
    const container = directive as ContainerDirective
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const label =
      typeof attrs.label === 'string' ? attrs.label : getLabel(container)
    const classAttr =
      typeof attrs.class === 'string'
        ? attrs.class
        : typeof attrs.className === 'string'
          ? attrs.className
          : typeof attrs.classes === 'string'
            ? attrs.classes
            : ''
    const disabled =
      typeof attrs.disabled === 'string'
        ? attrs.disabled !== 'false'
        : Boolean(attrs.disabled)
    const content = JSON.stringify(
      stripLabel(container.children as RootContent[])
    )
    const classes = classAttr.split(/\s+/).filter(Boolean)
    const node: Parent = {
      type: 'paragraph',
      children: [{ type: 'text', value: label || '' }],
      data: {
        hName: 'trigger',
        hProperties: {
          className: classes,
          content,
          disabled
        }
      }
    }
    const newIndex = replaceWithIndentation(directive, parent, index, [
      node as RootContent
    ])
    return [SKIP, newIndex]
  }

  /**
   * Converts an `onExit` directive into an OnExit component wrapper.
   *
   * @param directive - The directive node representing `onExit`.
   * @param parent - The parent AST node containing this directive.
   * @param index - The index of the directive node within its parent.
   * @returns The index of the inserted component.
   */
  /**
   * Determines whether a node is a directive node.
   *
   * @param node - Node to inspect.
   * @returns True if the node is a directive node.
   */
  const isDirectiveNode = (node: Node): node is DirectiveNode =>
    node.type === 'leafDirective' ||
    node.type === 'containerDirective' ||
    node.type === 'textDirective'

  /**
   * Filters directive children to allowed directives, optionally flagging banned ones.
   *
   * @param children - Raw nodes inside the directive.
   * @param allowed - Set of permitted directive names.
   * @param banned - Set of explicitly banned directive names.
   * @returns Filtered nodes, a flag for other invalid content, and whether banned directives were found.
   */
  const filterDirectiveChildren = (
    children: RootContent[],
    allowed: Set<string>,
    banned: Set<string> = new Set()
  ): [RootContent[], boolean, boolean] => {
    let invalidOther = false
    let bannedFound = false
    const filtered: RootContent[] = []
    children.forEach(child => {
      if (child.type === 'text') {
        if (toString(child).trim().length === 0) return
        invalidOther = true
        return
      }
      if (isDirectiveNode(child)) {
        if (banned.has(child.name)) {
          bannedFound = true
          return
        }
        if (allowed.has(child.name)) {
          filtered.push(child)
          return
        }
        invalidOther = true
        return
      }
      if (child.type === 'paragraph') {
        child.children.forEach(sub => {
          if (sub.type === 'text') {
            if (toString(sub).trim().length === 0) return
            invalidOther = true
            return
          }
          if (isDirectiveNode(sub)) {
            if (banned.has(sub.name)) {
              bannedFound = true
              return
            }
            if (allowed.has(sub.name)) {
              filtered.push(sub)
              return
            }
          }
          invalidOther = true
        })
        return
      }
      invalidOther = true
    })
    return [filtered, invalidOther, bannedFound]
  }

  const handleOnExit: DirectiveHandler = (directive, parent, index) => {
    if (!parent || typeof index !== 'number') return
    if (lastPassageIdRef.current !== currentPassageId) {
      resetDirectiveState()
    }
    if (onExitErrorRef.current) {
      return removeNode(parent, index)
    }
    if (onExitSeenRef.current) {
      onExitErrorRef.current = true
      const msg =
        'Multiple onExit directives in a single passage are not allowed'
      console.error(msg)
      addError(msg)
      return removeNode(parent, index)
    }
    onExitSeenRef.current = true
    const container = directive as ContainerDirective
    const allowed = ALLOWED_ONEXIT_DIRECTIVES
    const rawChildren = stripLabel(container.children as RootContent[])
    const [filtered, invalid] = filterDirectiveChildren(rawChildren, allowed)
    if (invalid) {
      const allowedList = [...allowed].join(', ')
      const msg = `onExit only supports directives: ${allowedList}`
      console.error(msg)
      addError(msg)
    }
    const content = JSON.stringify(filtered)
    const node: Parent = {
      type: 'paragraph',
      children: [{ type: 'text', value: '' }],
      data: { hName: 'onExit', hProperties: { content } }
    }
    const newIndex = replaceWithIndentation(directive, parent, index, [
      node as RootContent
    ])
    const markerIndex = newIndex + 1
    removeDirectiveMarker(parent, markerIndex)
    return [SKIP, newIndex]
  }

  /**
   * Converts `:::appear` directives into Appear elements.
   *
   * @param directive - The appear directive node.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within its parent.
   * @returns Visitor instructions after replacement.
   */
  const handleAppear: DirectiveHandler = (directive, parent, index) => {
    if (!parent || typeof index !== 'number') return
    const container = directive as ContainerDirective

    const { attrs } = extractAttributes<AppearSchema>(
      directive,
      parent,
      index,
      appearSchema
    )

    const content = runBlock(stripLabel(container.children as RootContent[]))

    const props: Record<string, unknown> = {}
    if (typeof attrs.at === 'number') props.at = attrs.at
    if (typeof attrs.exitAt === 'number') props.exitAt = attrs.exitAt
    if (attrs.enter) props.enter = attrs.enter
    if (attrs.exit) props.exit = attrs.exit
    if (attrs.interruptBehavior)
      props.interruptBehavior = attrs.interruptBehavior

    applyAdditionalAttributes(
      (directive.attributes || {}) as Record<string, unknown>,
      props,
      ['at', 'exitAt', 'enter', 'exit', 'interruptBehavior']
    )

    const appearNode: Parent = {
      type: 'paragraph',
      children: content,
      data: {
        hName: 'appear',
        hProperties: props as Properties
      }
    }

    const newIndex = replaceWithIndentation(directive, parent, index, [
      appearNode as RootContent
    ])
    removeDirectiveMarker(parent, newIndex + 1)
    return [SKIP, newIndex]
  }

  /**
   * Switches the active locale using `:lang[locale]`.
   *
   * @param directive - Directive node specifying the locale.
   * @param parent - Parent node of the directive.
   * @param index - Index of the directive within its parent.
   * @returns The new index after removing the directive.
   */
  const handleLang: DirectiveHandler = (directive, parent, index) => {
    const locale = toString(directive).trim()

    // Basic locale validation: e.g., "en", "en-US", "fr", "zh-CN"
    const LOCALE_PATTERN = /^[a-z]{2,3}(-[A-Z][a-zA-Z]{1,7})?$/

    if (
      locale &&
      LOCALE_PATTERN.test(locale) &&
      i18next.isInitialized &&
      i18next.resolvedLanguage !== locale
    ) {
      void i18next.changeLanguage(locale)
    }

    return removeNode(parent, index)
  }

  /**
   * Adds a translation using shorthand `:translations[locale]{ns:key="value"}`.
   *
   * @param directive - The directive node representing the translations.
   * @param parent - The parent AST node containing this directive.
   * @param index - The index of the directive node within its parent.
   * @returns The new index after processing.
   */
  const handleTranslations: DirectiveHandler = (directive, parent, index) => {
    const locale =
      getLabel(directive as ContainerDirective) || toString(directive).trim()
    const attrs = directive.attributes as Record<string, unknown>
    if (!locale?.trim() || !attrs) {
      const msg = 'Translations directive expects [locale]{ns:key="value"}'
      console.error(msg)
      addError(msg)
      return removeNode(parent, index)
    }
    const entries = Object.entries(attrs)
    if (entries.length !== 1) {
      const msg = 'Translations directive accepts only one namespace:key pair'
      console.error(msg)
      addError(msg)
      return removeNode(parent, index)
    }
    const [compound, raw] = entries[0]
    const m = compound.match(/^([^:]+):(.+)$/)
    if (m && typeof raw === 'string') {
      const ns = m[1]
      const key = m[2]
      const value = raw
      if (!i18next.hasResourceBundle(locale, ns)) {
        i18next.addResourceBundle(locale, ns, {}, true, true)
      }
      i18next.addResource(locale, ns, key, value)
    } else {
      const msg = 'Translations directive expects [locale]{ns:key="value"}'
      console.error(msg)
      addError(msg)
    }
    return removeNode(parent, index)
  }

  /**
   * Inserts a Show component that renders a translated string.
   * The directive label accepts `key` or `ns:key` and supports an optional
   * `count` attribute for pluralization.
   *
   * @param directive - The `t` directive node being processed.
   * @param parent - The parent AST node containing the directive.
   * @param index - The index of the directive within its parent.
   */
  const handleTranslate: DirectiveHandler = (directive, parent, index) => {
    const { attrs } = extractAttributes(
      directive,
      parent,
      index,
      { count: { type: 'number' } },
      { state: gameData }
    )
    const label = hasLabel(directive) ? directive.label.trim() : undefined
    let key = ''
    let ns: string | undefined
    if (label) {
      const [nsPart, keyPart] = label.split(':', 2)
      if (keyPart !== undefined) {
        ns = nsPart.trim()
        key = keyPart.trim()
      } else {
        key = nsPart.trim()
      }
    } else {
      const children = directive.children as (RootContent & { name?: string })[]
      if (
        children.length === 2 &&
        children[0].type === 'text' &&
        children[1].type === 'textDirective'
      ) {
        ns = (children[0] as MdText).value.trim()
        key = (children[1] as DirectiveNode).name
      } else if (children.length === 1 && children[0].type === 'text') {
        key = (children[0] as MdText).value.trim()
      } else {
        const text = toString(directive).trim()
        if (text) key = text
      }
    }
    if (!key) return removeNode(parent, index)
    const rawAttrs = { ...(directive.attributes || {}) } as Record<
      string,
      unknown
    >
    delete rawAttrs.count
    const vars: Record<string, unknown> = {}
    for (const [name, raw] of Object.entries(rawAttrs)) {
      if (raw == null) continue
      if (typeof raw === 'string') {
        try {
          const fn = compile(raw) as (scope: Record<string, unknown>) => unknown
          const value = fn(gameData)
          vars[name] = value ?? raw
        } catch (error) {
          const msg = `Failed to evaluate t directive var: ${raw}`
          console.error(msg, error)
          addError(msg)
          const match = raw.match(QUOTE_PATTERN)
          vars[name] = match ? match[2] : raw
        }
      } else {
        vars[name] = raw
      }
    }
    if (parent && typeof index === 'number') {
      const prev = parent.children[index - 1] as MdText | undefined
      const next = parent.children[index + 1] as MdText | undefined
      const inLink =
        prev?.type === 'text' &&
        prev.value.endsWith('[[') &&
        next?.type === 'text' &&
        next.value.includes(']]')
      const options = {
        ...vars,
        ...getTranslationOptions({ ns, count: attrs.count })
      }
      if (inLink) {
        const text = i18next.t(key, options)
        if (prev && next) {
          prev.value += text + next.value
          parent.children.splice(index, 2)
          return index - 1
        }
        return replaceWithIndentation(directive, parent, index, [
          { type: 'text', value: text }
        ])
      }
      const props: Properties = { 'data-i18n-key': key }
      if (ns) props['data-i18n-ns'] = ns
      if (options.count !== undefined) props['data-i18n-count'] = options.count
      if (Object.keys(vars).length > 0)
        props['data-i18n-vars'] = JSON.stringify(vars)
      const node: MdText = {
        type: 'text',
        value: '0', // non-empty placeholder required for mdast conversion
        data: { hName: 'show', hProperties: props }
      }
      return replaceWithIndentation(directive, parent, index, [node])
    }
    return index
  }

  /**
   * Extracts the content of a string wrapped in matching quotes or backticks.
   *
   * @param value - The raw string to inspect.
   * @returns The inner string if quoted, otherwise undefined.
   */
  const getQuotedValue = (value: string): string | undefined => {
    const match = value.trim().match(QUOTE_PATTERN)
    return match ? match[2] : undefined
  }

  /**
   * Retrieves a string or numeric value from the game state by key.
   *
   * @param key - The game state key to read.
   * @returns The value as a string if present, otherwise undefined.
   */
  const getStateValue = (key: string): string | undefined => {
    if (!Object.hasOwn(gameData, key)) return undefined
    const value = (gameData as Record<string, unknown>)[key]
    return typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : undefined
  }

  /**
   * Resolves a passage target from directive text or attributes.
   *
   * @param rawText - The trimmed text content of the directive.
   * @param attrs - Attributes associated with the directive.
   * @returns The passage id or name if recognized, otherwise undefined.
   */
  const resolvePassageTarget = (
    rawText: string,
    attrs: Record<string, unknown>
  ): string | undefined => {
    if (rawText) {
      return (
        getQuotedValue(rawText) ??
        (NUMERIC_PATTERN.test(rawText) ? rawText : undefined)
      )
    }
    const attr =
      typeof attrs.passage === 'string' ? attrs.passage.trim() : undefined
    return attr
      ? (getQuotedValue(attr) ??
          (NUMERIC_PATTERN.test(attr) ? attr : getStateValue(attr)))
      : undefined
  }

  /**
   * Handles the `:goto` directive, which navigates to another passage.
   * Passage names must be wrapped in matching quotes or backticks, while
   * unquoted numbers are treated as passage IDs. When the `passage` attribute
   * is an unquoted string, its value is looked up as a key in the game state.
   * All other inputs are ignored.
   *
   * @param directive - The directive node representing the goto directive.
   * @param parent - The parent AST node containing this directive.
   * @param index - The index of the directive node within its parent.
   * @returns The new index after replacement.
   */
  const handleGoto: DirectiveHandler = (directive, parent, index) => {
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const rawText = toString(directive).trim()
    const target = resolvePassageTarget(rawText, attrs)

    const passage = target
      ? NUMERIC_PATTERN.test(target)
        ? getPassageById(target)
        : getPassageByName(target)
      : null

    if (passage && target) {
      setCurrentPassage(target)
    } else if (rawText || attrs.passage) {
      const msg = `Passage not found: ${rawText || attrs.passage}`
      console.error(msg)
      addError(msg)
    }

    return removeNode(parent, index)
  }

  /**
   * Saves the current game state to local storage.
   *
   * @param directive - The directive node being processed.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within the parent.
   */
  const handleSave: DirectiveHandler = (directive, parent, index) => {
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const id = typeof attrs.id === 'string' ? attrs.id : 'campfire.save'
    setLoading(true)
    try {
      if (typeof localStorage !== 'undefined') {
        const cps = useGameStore.getState().checkpoints
        const data = {
          gameData: { ...(state.getState() as Record<string, unknown>) },
          lockedKeys: { ...state.getLockedKeys() },
          onceKeys: { ...state.getOnceKeys() },
          checkpoints: { ...cps },
          currentPassageId
        }
        localStorage.setItem(id, JSON.stringify(data))
      }
    } catch (error) {
      console.error('Error saving game state:', error)
      addError('Failed to save game state')
    } finally {
      setLoading(false)
    }
    return removeNode(parent, index)
  }

  /**
   * Loads a game state from local storage.
   *
   * @param directive - The directive node being processed.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within the parent.
   */
  const handleLoad: DirectiveHandler = (directive, parent, index) => {
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const id = typeof attrs.id === 'string' ? attrs.id : 'campfire.save'
    setLoading(true)
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(id)
        if (raw) {
          const data = JSON.parse(raw) as {
            gameData?: Record<string, unknown>
            lockedKeys?: Record<string, true>
            onceKeys?: Record<string, true>
            checkpoints?: Record<string, Checkpoint<Record<string, unknown>>>
            currentPassageId?: string
          }
          useGameStore.setState({
            gameData: { ...(data.gameData || {}) },
            lockedKeys: { ...(data.lockedKeys || {}) },
            onceKeys: { ...(data.onceKeys || {}) },
            checkpoints: { ...(data.checkpoints || {}) }
          })
          if (data.currentPassageId) {
            setCurrentPassage(data.currentPassageId)
          } else {
            const msg = 'Saved game state has no current passage'
            console.error(msg)
            addError(msg)
          }
        }
      }
    } catch (error) {
      console.error('Error loading game state:', error)
      addError('Failed to load game state')
    } finally {
      setLoading(false)
    }
    return removeNode(parent, index)
  }

  /**
   * Clears a saved game state from local storage.
   *
   * @param directive - The directive node being processed.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within the parent.
   */
  const handleClearSave: DirectiveHandler = (directive, parent, index) => {
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const id = typeof attrs.id === 'string' ? attrs.id : 'campfire.save'
    setLoading(true)
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(id)
      }
    } catch (error) {
      console.error('Error clearing saved game state:', error)
      addError('Failed to clear saved game state')
    } finally {
      setLoading(false)
    }
    return removeNode(parent, index)
  }

  const handleCheckpoint: DirectiveHandler = (directive, parent, index) => {
    if (lastPassageIdRef.current !== currentPassageId) {
      resetDirectiveState()
    }
    if (includeDepth > 0) return removeNode(parent, index)
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const id = ensureKey(attrs.id, parent, index)
    if (!id) return index
    if (checkpointErrorRef.current) {
      return removeNode(parent, index)
    }
    if (checkpointIdRef.current) {
      removeCheckpoint(checkpointIdRef.current)
      checkpointIdRef.current = null
      checkpointErrorRef.current = true
      const msg = 'Multiple checkpoints in a single passage are not allowed'
      console.error(msg)
      addError(msg)
      return removeNode(parent, index)
    }
    checkpointIdRef.current = id
    const label =
      typeof attrs.label === 'string' ? i18next.t(attrs.label) : undefined
    saveCheckpoint(id, {
      gameData: { ...(gameData as Record<string, unknown>) },
      lockedKeys: { ...lockedKeys },
      onceKeys: { ...onceKeys },
      currentPassageId,
      label
    })
    return removeNode(parent, index)
  }

  /**
   * Handles the `:loadCheckpoint` directive, which loads the saved checkpoint.
   * If the directive is used inside an included passage, it is ignored.
   *
   * @param directive - The directive node representing `:loadCheckpoint`.
   * @param parent - The parent AST node containing this directive.
   * @param index - The index of this directive within the parent's children.
   * @returns The index at which processing should continue.
   */
  const handleLoadCheckpoint: DirectiveHandler = (
    _directive,
    parent,
    index
  ) => {
    if (includeDepth > 0) return removeNode(parent, index)
    const cp = loadCheckpointFn()
    if (cp?.currentPassageId) {
      setCurrentPassage(cp.currentPassageId)
    }
    return removeNode(parent, index)
  }

  /**
   * Handles the `:clearCheckpoint` directive, which removes the currently saved
   * checkpoint. If the directive is used inside an included passage, it is
   * ignored.
   *
   * @param directive - The directive node representing `:clearCheckpoint`.
   * @param parent - The parent AST node containing this directive.
   * @param index - The index of this directive within the parent's children.
   * @returns The index at which processing should continue.
   */
  const handleClearCheckpoint: DirectiveHandler = (
    _directive,
    parent,
    index
  ) => {
    if (includeDepth > 0) return removeNode(parent, index)
    useGameStore.setState({ checkpoints: {} })
    return removeNode(parent, index)
  }

  /**
   * Parses a deck size string such as "1920x1080" or an aspect ratio like
   * "16x9" into a width/height object. Aspect ratios assume a default width of
   * {@link DEFAULT_DECK_WIDTH} pixels.
   *
   * @param value - Raw size attribute value.
   * @returns Parsed deck size object.
   */
  const parseDeckSize = (value: string): { width: number; height: number } => {
    const match = value.match(/^(\d+)x(\d+)$/)
    if (match) {
      const w = parseInt(match[1], 10)
      const h = parseInt(match[2], 10)
      if (w <= ASPECT_RATIO_THRESHOLD && h <= ASPECT_RATIO_THRESHOLD) {
        const width = DEFAULT_DECK_WIDTH
        const height = Math.round((width * h) / w)
        return { width, height }
      }
      return { width: w, height: h }
    }
    return { width: DEFAULT_DECK_WIDTH, height: DEFAULT_DECK_HEIGHT }
  }

  /**
   * Parses a theme attribute value, accepting either a string token or a JSON
   * object string.
   *
   * @param value - Raw theme attribute value.
   * @returns Theme token map when parsable.
   */
  const parseThemeValue = (
    value: unknown
  ): Record<string, string | number> | undefined => {
    if (!value) return undefined
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        return { theme: value }
      }
    }
    if (typeof value === 'object')
      return value as Record<string, string | number>
    return undefined
  }

  /**
   * Copies attributes from a source map into a target props object, excluding
   * keys specified in {@link exclude}.
   *
   * @param source - Raw attribute map.
   * @param target - Props object to receive the attributes.
   * @param exclude - Keys to omit when copying.
   */
  const applyAdditionalAttributes = (
    source: Record<string, unknown>,
    target: Record<string, unknown>,
    exclude: readonly string[]
  ) => {
    for (const key of Object.keys(source)) {
      if (!exclude.includes(key)) {
        target[key] = source[key]
      }
    }
  }

  /** Schema describing supported appear directive attributes. */
  const appearSchema = {
    at: { type: 'number' },
    exitAt: { type: 'number' },
    enter: { type: 'string' },
    exit: { type: 'string' },
    interruptBehavior: { type: 'string' }
  } as const

  type AppearSchema = typeof appearSchema
  type AppearAttrs = ExtractedAttrs<AppearSchema>

  /** Schema describing supported slide directive attributes. */
  const slideSchema = {
    transition: { type: 'string' },
    background: { type: 'string' },
    steps: { type: 'number' },
    onEnter: { type: 'string' },
    onExit: { type: 'string' }
  } as const

  type SlideSchema = typeof slideSchema
  type SlideAttrs = ExtractedAttrs<SlideSchema>

  /** Schema describing supported text directive attributes. */
  const textSchema = {
    x: { type: 'number' },
    y: { type: 'number' },
    w: { type: 'number' },
    h: { type: 'number' },
    z: { type: 'number' },
    rotate: { type: 'number' },
    scale: { type: 'number' },
    anchor: { type: 'string' },
    as: { type: 'string' },
    content: { type: 'string' },
    align: { type: 'string' },
    size: { type: 'number' },
    weight: { type: 'number' },
    lineHeight: { type: 'number' },
    color: { type: 'string' }
  } as const

  type TextSchema = typeof textSchema
  type TextAttrs = ExtractedAttrs<TextSchema>

  /**
   * Converts a `:::text` directive into a DeckText element.
   *
   * @param directive - The text directive node.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within its parent.
   * @returns Visitor instructions after replacement.
   */
  const handleText: DirectiveHandler = (directive, parent, index) => {
    if (!parent || typeof index !== 'number') return
    const container = directive as ContainerDirective

    const { attrs } = extractAttributes<TextSchema>(
      directive,
      parent,
      index,
      textSchema
    )

    const tagName = attrs.as ? String(attrs.as) : 'p'

    const style: string[] = []
    // Positioning
    style.push('position:absolute')
    if (typeof attrs.x === 'number') style.push(`left:${attrs.x}px`)
    if (typeof attrs.y === 'number') style.push(`top:${attrs.y}px`)
    if (typeof attrs.w === 'number') style.push(`width:${attrs.w}px`)
    if (typeof attrs.h === 'number') style.push(`height:${attrs.h}px`)
    if (typeof attrs.z === 'number') style.push(`z-index:${attrs.z}`)
    const transforms: string[] = []
    if (typeof attrs.rotate === 'number')
      transforms.push(`rotate(${attrs.rotate}deg)`)
    if (typeof attrs.scale === 'number')
      transforms.push(`scale(${attrs.scale})`)
    if (transforms.length) style.push(`transform:${transforms.join(' ')}`)
    if (attrs.anchor && attrs.anchor !== 'top-left') {
      const originMap: Record<string, string> = {
        'top-left': '0% 0%',
        top: '50% 0%',
        'top-right': '100% 0%',
        left: '0% 50%',
        center: '50% 50%',
        right: '100% 50%',
        'bottom-left': '0% 100%',
        bottom: '50% 100%',
        'bottom-right': '100% 100%'
      }
      const origin = originMap[attrs.anchor]
      if (origin) style.push(`transform-origin:${origin}`)
    }
    // Typography
    if (attrs.align) style.push(`text-align:${attrs.align}`)
    if (typeof attrs.size === 'number') style.push(`font-size:${attrs.size}px`)
    if (typeof attrs.weight === 'number')
      style.push(`font-weight:${attrs.weight}`)
    if (typeof attrs.lineHeight === 'number')
      style.push(`line-height:${attrs.lineHeight}`)
    if (attrs.color) style.push(`color:${attrs.color}`)

    const props: Record<string, unknown> = {}
    if (style.length) props.style = style.join(';')

    const rawAttrs = (directive.attributes || {}) as Record<string, unknown>
    const classAttr =
      typeof rawAttrs.class === 'string'
        ? rawAttrs.class
        : typeof rawAttrs.className === 'string'
          ? rawAttrs.className
          : typeof rawAttrs.classes === 'string'
            ? rawAttrs.classes
            : undefined
    const classes = ['text-base', 'font-normal']
    if (classAttr) classes.unshift(classAttr)
    props.className = classes.join(' ')
    props['data-component'] = 'deck-text'
    props['data-as'] = tagName

    applyAdditionalAttributes(rawAttrs, props, [
      'x',
      'y',
      'w',
      'h',
      'z',
      'rotate',
      'scale',
      'anchor',
      'as',
      'content',
      'align',
      'size',
      'weight',
      'lineHeight',
      'color',
      'class',
      'className',
      'classes'
    ])

    let content: RootContent[]
    if (attrs.content) {
      content = [{ type: 'text', value: attrs.content } as RootContent]
    } else {
      const processed = runBlock(
        stripLabel(container.children as RootContent[])
      )
      if (processed.length === 1 && processed[0].type === 'paragraph') {
        content = (processed[0] as Parent).children as RootContent[]
      } else {
        content = processed
      }
    }

    const textNode: Parent = {
      type: 'paragraph',
      children: content,
      data: { hName: tagName, hProperties: props as Properties }
    }

    const newIndex = replaceWithIndentation(directive, parent, index, [
      textNode as RootContent
    ])
    const markerIndex = newIndex + 1
    if (
      parent.children[markerIndex]?.type === 'text' &&
      /^\s*$/.test((parent.children[markerIndex] as MdText).value)
    ) {
      parent.children.splice(markerIndex, 1)
    }
    removeDirectiveMarker(parent, markerIndex)
    return [SKIP, newIndex]
  }

  /**
   * Builds a props object for the Slide component from extracted attributes.
   *
   * @param attrs - Extracted slide attributes.
   * @returns Slide props object.
   */
  const buildSlideProps = (attrs: SlideAttrs): Record<string, unknown> => {
    const props: Record<string, unknown> = {}
    if (attrs.transition) {
      props.transition =
        typeof attrs.transition === 'string'
          ? { type: attrs.transition }
          : attrs.transition
    }
    if (attrs.background) props.background = attrs.background
    if (typeof attrs.steps === 'number') props.steps = attrs.steps
    if (attrs.onEnter) props.onEnter = attrs.onEnter
    if (attrs.onExit) props.onExit = attrs.onExit
    applyAdditionalAttributes(attrs as Record<string, unknown>, props, [
      'transition',
      'background',
      'steps',
      'onEnter',
      'onExit'
    ])
    return props
  }

  /**
   * Converts a `:::deck` directive into a Deck element with Slide children.
   *
   * @param directive - The deck directive node.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within its parent.
   * @returns Visitor instructions after replacement.
   */
  const handleDeck: DirectiveHandler = (directive, parent, index) => {
    if (!parent || typeof index !== 'number') return
    const container = directive as ContainerDirective

    const { attrs: deckAttrs } = extractAttributes(
      directive,
      parent,
      index,
      {
        size: { type: 'string' },
        transition: { type: 'string' },
        theme: { type: 'string' }
      },
      { label: false }
    )

    const deckProps: Record<string, unknown> = {}
    if (typeof deckAttrs.size === 'string') {
      deckProps.size = parseDeckSize(deckAttrs.size)
    }
    if (deckAttrs.transition) deckProps.transition = deckAttrs.transition
    if (typeof deckAttrs.theme !== 'undefined') {
      const theme = parseThemeValue(deckAttrs.theme)
      if (theme) deckProps.theme = theme
    }
    const rawDeckAttrs = (directive.attributes || {}) as Record<string, unknown>
    applyAdditionalAttributes(rawDeckAttrs, deckProps, [
      'size',
      'transition',
      'theme'
    ])

    const slides: Parent[] = []

    const isMarkerParagraph = (node: RootContent) => {
      if (
        node.type === 'paragraph' &&
        node.children.length > 0 &&
        node.children.every(isTextNode)
      ) {
        const combined = node.children.map(c => (c as MdText).value).join('')
        const stripped = combined.replace(/\s+/g, '')
        const parts = stripped.split(DIRECTIVE_MARKER)
        return stripped.length > 0 && parts.every(part => part === '')
      }
      return false
    }

    let endPos = parent.children.length
    for (let i = parent.children.length - 1; i > index; i--) {
      if (isMarkerParagraph(parent.children[i] as RootContent)) {
        endPos = i
        break
      }
    }
    const rawFollowing = parent.children.slice(index + 1, endPos)
    if (endPos > index + 1) {
      parent.children.splice(index + 1, endPos - (index + 1))
    }
    const following = rawFollowing.filter(
      node => !isMarkerParagraph(node as RootContent)
    )

    const children = preprocessBlock(
      stripLabel([...(container.children as RootContent[]), ...following])
    )
    let pendingAttrs: Record<string, unknown> = {}
    let pendingNodes: RootContent[] = []

    /**
     * Finalizes the currently buffered slide content and adds it to the deck.
     * Removes any trailing directive markers before running the remark
     * pipeline so stray markers do not render in the output.
     */
    const commitPending = () => {
      const tempParent: Parent = { type: 'root', children: pendingNodes }
      removeDirectiveMarker(tempParent, tempParent.children.length - 1)
      pendingNodes = tempParent.children

      if (!pendingNodes.length && Object.keys(pendingAttrs).length === 0) return
      const dummy: DirectiveNode = {
        type: 'containerDirective',
        name: 'slide',
        attributes: pendingAttrs as Record<string, string | null>,
        children: []
      }
      const { attrs: parsed } = extractAttributes<SlideSchema>(
        dummy,
        undefined,
        undefined,
        slideSchema
      )
      const content = runBlock(stripLabel(pendingNodes))
      const slideNode: Parent = {
        type: 'paragraph',
        children: content,
        data: {
          hName: 'slide',
          hProperties: buildSlideProps(parsed) as Properties
        }
      }
      slides.push(slideNode)
      pendingAttrs = {}
      pendingNodes = []
    }

    children.forEach((child, i) => {
      if (
        child.type === 'containerDirective' &&
        (child as ContainerDirective).name === 'slide'
      ) {
        commitPending()
        const slideDir = child as ContainerDirective
        const { attrs: parsed } = extractAttributes<SlideSchema>(
          slideDir,
          container,
          i,
          slideSchema
        )
        const content = runBlock(stripLabel(slideDir.children as RootContent[]))
        const slideNode: Parent = {
          type: 'paragraph',
          children: content,
          data: {
            hName: 'slide',
            hProperties: buildSlideProps(parsed) as Properties
          }
        }
        slides.push(slideNode)
      } else if (
        child.type === 'leafDirective' &&
        (child as DirectiveNode).name === 'slide'
      ) {
        commitPending()
        const { attrs: parsed } = extractAttributes<SlideSchema>(
          child as DirectiveNode,
          container,
          i,
          slideSchema
        )
        pendingAttrs = parsed
      } else {
        pendingNodes.push(child)
      }
    })
    commitPending()

    const deckNode: Parent = {
      type: 'paragraph',
      children: slides as RootContent[],
      data: { hName: 'deck', hProperties: deckProps as Properties }
    }
    const newIndex = replaceWithIndentation(directive, parent, index, [
      deckNode as RootContent
    ])
    removeDirectiveMarker(parent, newIndex + 1)
    return [SKIP, newIndex]
  }

  /**
   * Handles the `:title` directive, which overrides the page title for the current passage.
   * The directive's value must be wrapped in matching quotes or backticks. If the
   * directive is used inside an included passage, it is ignored. When valid, the
   * document title is updated and marked as overridden.
   *
   * @param directive - The directive node representing the title directive.
   * @param parent - The parent AST node containing this directive.
   * @param index - The index of the directive node within its parent.
   * @returns The new index after replacement.
   */
  const handleTitle: DirectiveHandler = (directive, parent, index) => {
    if (includeDepth > 0) return removeNode(parent, index)
    const raw = toString(directive).trim()
    const title = getQuotedValue(raw)
    if (title) {
      document.title = i18next.t(title)
      markTitleOverridden()
    } else if (raw) {
      const msg =
        'Title directive value must be wrapped in matching quotes or backticks'
      console.error(msg)
      addError(msg)
    }
    return removeNode(parent, index)
  }

  /**
   * Handles the `:include` directive, which inserts the content of another passage.
   * Passage names must be wrapped in matching quotes or backticks, while unquoted
   * numbers are treated as passage IDs. When the `passage` attribute is an
   * unquoted string, its value is looked up as a key in the game state. Inputs
   * that do not match these patterns are ignored. Prevents infinite recursion by
   * limiting the include depth.
   *
   * @param directive - The directive node representing the include directive.
   * @param parent - The parent AST node containing this directive.
   * @param index - The index of the directive node within its parent.
   * @returns The new index after replacement, or removes the node if not found or on error.
   */
  const handleInclude: DirectiveHandler = (directive, parent, index) => {
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const rawText = toString(directive).trim()
    const target = resolvePassageTarget(rawText, attrs)

    if (!parent || typeof index !== 'number' || !target) {
      return removeNode(parent, index)
    }

    if (includeDepth >= MAX_INCLUDE_DEPTH) {
      console.warn('Max include depth reached')
      return removeNode(parent, index)
    }

    const passage = NUMERIC_PATTERN.test(target)
      ? getPassageById(target)
      : getPassageByName(target)

    if (!passage) return removeNode(parent, index)

    const text = passage.children
      .map((child: ElementContent) =>
        child.type === 'text' ? (child as HastText).value : ''
      )
      .join('')

    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkDirective)
      .use(remarkCampfireIndentation)
      .use(remarkCampfire, { handlers: handlersRef.current })

    includeDepth++
    const tree = processor.parse(text)
    processor.runSync(tree)
    includeDepth--

    const newIndex = replaceWithIndentation(
      directive,
      parent,
      index,
      tree.children as RootContent[]
    )
    return [
      SKIP,
      newIndex + Math.max(0, (tree.children as RootContent[]).length - 1)
    ]
  }

  return useMemo(() => {
    // noinspection JSUnusedGlobalSymbols
    const handlers = {
      set: (d: DirectiveNode, p: Parent | undefined, i: number | undefined) =>
        handleSet(d, p, i, false),
      setOnce: (
        d: DirectiveNode,
        p: Parent | undefined,
        i: number | undefined
      ) => handleSet(d, p, i, true),
      array: (d: DirectiveNode, p: Parent | undefined, i: number | undefined) =>
        handleArray(d, p, i, false),
      arrayOnce: (
        d: DirectiveNode,
        p: Parent | undefined,
        i: number | undefined
      ) => handleArray(d, p, i, true),
      createRange: handleCreateRange,
      setRange: handleSetRange,
      show: handleShow,
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
      unset: handleUnset,
      if: handleIf,
      else: handleElse,
      once: handleOnce,
      batch: handleBatch,
      trigger: handleTrigger,
      onExit: handleOnExit,
      appear: handleAppear,
      text: handleText,
      deck: handleDeck,
      lang: handleLang,
      include: handleInclude,
      title: handleTitle,
      goto: handleGoto,
      save: handleSave,
      load: handleLoad,
      clearSave: handleClearSave,
      checkpoint: handleCheckpoint,
      clearCheckpoint: handleClearCheckpoint,
      loadCheckpoint: handleLoadCheckpoint,
      translations: handleTranslations,
      t: handleTranslate
    }
    handlersRef.current = handlers
    return handlers
  }, [])
}
