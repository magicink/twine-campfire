import { useEffect, useMemo, useRef } from 'preact/hooks'
import i18next from 'i18next'
import { SKIP } from 'unist-util-visit'
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
import type { Parent, RootContent, Text as MdText, InlineCode } from 'mdast'
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
import { AudioManager } from '@campfire/audio/AudioManager'
import { ImageManager } from '@campfire/image/ImageManager'
import {
  type DirectiveNode,
  type ExtractedAttrs,
  type AttributeSchema,
  ensureKey,
  extractAttributes,
  getLabel,
  isRange,
  removeNode,
  stripLabel,
  runWithIdOrSrc
} from '@campfire/utils/directiveUtils'
import {
  getRandomInt,
  getRandomItem,
  parseNumericValue
} from '@campfire/utils/math'
import {
  parseTypedValue,
  extractKeyValue,
  replaceWithIndentation,
  expandIndentedCode,
  applyKeyValue,
  runDirectiveBlock
} from '@campfire/utils/directiveUtils'
import { DEFAULT_DECK_HEIGHT, DEFAULT_DECK_WIDTH } from '@campfire/constants'
import type {
  Transition,
  Direction
} from '@campfire/components/Deck/Slide/types'
import {
  evalExpression,
  getTranslationOptions,
  interpolateString,
  QUOTE_PATTERN,
  extractQuoted
} from '@campfire/utils/core'
import {
  createStateManager,
  type SetOptions,
  type StateManagerType
} from '@campfire/state/stateManager'

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
  'for',
  'batch'
])
const ALLOWED_BATCH_DIRECTIVES = new Set(
  [...ALLOWED_ONEXIT_DIRECTIVES].filter(name => name !== 'batch')
)
const BANNED_BATCH_DIRECTIVES = new Set(['batch'])

/** Marker inserted to close directive blocks. */
const DIRECTIVE_MARKER = ':::'

/** Event directives supported by interactive elements. */
const INTERACTIVE_EVENTS = new Set(['onHover', 'onFocus', 'onBlur'])

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
  const presetsRef = useRef<
    Record<string, Record<string, Record<string, unknown>>>
  >({})
  const checkpointIdRef = useRef<string | null>(null)
  const checkpointErrorRef = useRef(false)
  const onExitSeenRef = useRef(false)
  const onExitErrorRef = useRef(false)
  const lastPassageIdRef = useRef<string | undefined>(undefined)
  const audio = AudioManager.getInstance()
  const images = ImageManager.getInstance()

  const MAX_INCLUDE_DEPTH = 10
  let includeDepth = 0

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
   * Inserts a Show component that displays the value for a key or the result
   * of an expression.
   *
   * @param directive - The directive node representing the show directive.
   * @param parent - The parent AST node containing this directive.
   * @param index - The index of the directive node within its parent.
   */
  const handleShow: DirectiveHandler = (directive, parent, index) => {
    let raw = toString(directive).trim()
    if (
      directive.children &&
      directive.children.length === 1 &&
      directive.children[0].type === 'inlineCode'
    ) {
      raw = `\`${(directive.children[0] as InlineCode).value}\``
    }
    if (!raw) return removeNode(parent, index)
    const keyPattern = /^[A-Za-z_$][A-Za-z0-9_$]*$/
    const props: Record<string, unknown> = keyPattern.test(raw)
      ? { 'data-key': raw }
      : { 'data-expr': raw }
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    if (Object.prototype.hasOwnProperty.call(attrs, 'class')) {
      const msg = 'class is a reserved attribute. Use className instead.'
      console.error(msg)
      addError(msg)
    }
    const classAttr = typeof attrs.className === 'string' ? attrs.className : ''
    const styleAttr = typeof attrs.style === 'string' ? attrs.style : undefined
    if (classAttr) props.className = classAttr
    if (styleAttr) props.style = styleAttr
    applyAdditionalAttributes(attrs, props, ['className', 'style'])
    const node: MdText = {
      type: 'text',
      value: '',
      data: {
        hName: 'show',
        hProperties: props as Properties
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
   * Determines whether a paragraph consists solely of directive markers.
   *
   * @param node - Node to examine.
   * @returns True if the node contains only marker tokens and whitespace.
   */
  const isMarkerParagraph = (node: RootContent): boolean => {
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

  /**
   * Determines whether a node contains only whitespace or marker tokens.
   *
   * @param node - Node to examine.
   * @returns True if the node has no meaningful content.
   */
  const isWhitespaceNode = (node: RootContent): boolean =>
    (node.type === 'text' && node.value.trim() === '') ||
    (node.type === 'paragraph' &&
      node.children.every(isTextNode) &&
      (toString(node).trim() === '' || isMarkerParagraph(node)))

  /**
   * Extracts event directives from a list of child nodes.
   *
   * @param nodes - Nodes to inspect.
   * @returns Object with serialized event blocks and remaining nodes.
   */
  const extractEventProps = (
    nodes: RootContent[]
  ): { events: Record<string, string>; remaining: RootContent[] } => {
    const events: Record<string, string> = {}
    const remaining: RootContent[] = []
    for (const node of nodes) {
      if (
        node.type === 'containerDirective' &&
        INTERACTIVE_EVENTS.has((node as ContainerDirective).name)
      ) {
        const name = (node as ContainerDirective).name
        events[name] = JSON.stringify(
          stripLabel((node as ContainerDirective).children as RootContent[])
        )
      } else if (!isWhitespaceNode(node)) {
        remaining.push(node)
      }
    }
    return { events, remaining }
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
      const cloned = nodes.map(node => structuredClone(node))
      const processed = runDirectiveBlock(expandIndentedCode(cloned))
      const stripped = stripLabel(processed)
      return stripped.filter(
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
   * Merges scoped state changes back into the parent state while optionally
   * excluding a loop variable key.
   *
   * @param prev - The parent state manager.
   * @param scoped - The scoped state manager.
   * @param excludeKey - Optional key to remove from the pending changes.
   */
  const mergeScopedChanges = (
    prev: StateManagerType<Record<string, unknown>>,
    scoped: StateManagerType<Record<string, unknown>>,
    excludeKey?: string
  ) => {
    const changes = scoped.getChanges()
    if (excludeKey) {
      delete (changes.data as Record<string, unknown>)[excludeKey]
      changes.unset = changes.unset.filter(k => k !== excludeKey)
      changes.locks = changes.locks.filter(k => k !== excludeKey)
      changes.once = changes.once.filter(k => k !== excludeKey)
    }
    state = prev
    state.applyChanges(changes)
    gameData = state.getState()
    lockedKeys = state.getLockedKeys()
    onceKeys = state.getOnceKeys()
  }

  /**
   * Repeats the directive block for each item in an iterable expression.
   *
   * @param directive - The `for` directive node.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within the parent.
   * @returns Visitor instruction tuple.
   */
  const handleFor: DirectiveHandler = (directive, parent, index) => {
    if (!parent || typeof index !== 'number') return
    const container = directive as ContainerDirective
    const label = getLabel(container).trim()
    const match = label.match(/^([A-Za-z_$][\w$]*)\s+in\s+(.+)$/)
    if (!match) {
      const msg = `Malformed for directive: ${label}`
      console.error(msg)
      addError(msg)
      const removed = removeNode(parent, index)
      if (typeof removed === 'number') removeDirectiveMarker(parent, removed)
      return [SKIP, index]
    }
    const varKey = ensureKey(match[1], parent, index)
    if (!varKey) return [SKIP, index]
    const expr = match[2]

    let iterableValue: unknown
    try {
      iterableValue = evalExpression(expr, gameData)
      if (typeof iterableValue === 'undefined') {
        iterableValue = parseTypedValue(expr, gameData)
      }
    } catch (error) {
      console.warn(
        `Failed to evaluate expression in for directive: ${expr}`,
        error
      )
      iterableValue = parseTypedValue(expr, gameData)
    }

    let items: unknown[] = []
    if (Array.isArray(iterableValue)) {
      items = iterableValue
    } else if (isRange(iterableValue)) {
      for (let v = iterableValue.min; v <= iterableValue.max; v++) {
        items.push(v)
      }
    }

    const template = stripLabel(container.children as RootContent[])
    const serializedTemplate = JSON.stringify(template)

    /**
     * Retrieves directive metadata from a node.
     *
     * @param node - The node to inspect.
     * @returns The directive's hName and hProperties if available.
     */
    const getNodeData = (
      node: unknown
    ): { hName?: string; hProperties?: Record<string, unknown> } =>
      (
        node as {
          data?: { hName?: string; hProperties?: Record<string, unknown> }
        }
      ).data || {}

    const output: RootContent[] = []
    for (const item of items) {
      const scoped = state.createScope()
      const prevState = state
      state = scoped
      gameData = scoped.getState()
      lockedKeys = scoped.getLockedKeys()
      onceKeys = scoped.getOnceKeys()

      setValue(varKey, item)

      const cloned = JSON.parse(serializedTemplate) as RootContent[]
      const processed = runDirectiveBlock(
        expandIndentedCode(cloned),
        handlersRef.current
      )

      /**
       * Expands loop variable references within the node tree by:
       *
       * - Replacing `show` directives that reference the loop variable with
       *   plain text nodes containing the current item value.
       * - Evaluating serialized `if` directive blocks and inlining their
       *   `content` or `fallback` nodes so conditional checks involving the
       *   loop variable resolve correctly without relying on state after the
       *   loop iteration.
       *
       * @param nodes - Nodes to process for in-place expansion.
       */
      const expandLoopVars = (nodes: RootContent[]): void => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i]
          if (
            (isTextNode(node) &&
              node.data?.hName === 'show' &&
              node.data.hProperties?.['data-key'] === varKey) ||
            (node.type === 'textDirective' &&
              (node as { name?: string }).name === 'show' &&
              toString(node) === varKey)
          ) {
            nodes[i] = { type: 'text', value: String(item) }
            continue
          }
          const { hName, hProperties: props } = getNodeData(node)
          if (hName === 'if' && props) {
            const testExpr = String(props.test)
            let passes = false
            try {
              passes = Boolean(evalExpression(testExpr, gameData))
            } catch {
              try {
                passes = Boolean(parseTypedValue(testExpr, gameData))
              } catch {
                passes = false
              }
            }
            const key = passes ? 'content' : 'fallback'
            const selected = props[key as 'content' | 'fallback']
            const parsed =
              typeof selected === 'string'
                ? (JSON.parse(selected) as RootContent[])
                : []
            expandLoopVars(parsed)
            nodes.splice(i, 1, ...parsed)
            i += parsed.length - 1
            continue
          }
          if ('children' in node) {
            expandLoopVars(((node as Parent).children as RootContent[]) || [])
          }
        }
      }

      expandLoopVars(processed)
      output.push(...processed)

      mergeScopedChanges(prevState, scoped, varKey)
    }

    const newIndex = replaceWithIndentation(directive, parent, index, output)
    const markerIndex = newIndex + output.length
    removeDirectiveMarker(parent, markerIndex)
    const offset = output.length > 0 ? output.length - 1 : 0
    return [SKIP, newIndex + offset]
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
    const rawChildren = runDirectiveBlock(
      expandIndentedCode(container.children as RootContent[])
    )
    const processedChildren = stripLabel(rawChildren)
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

    runDirectiveBlock(expandIndentedCode(filtered), handlersRef.current)

    const changes = scoped.getChanges()
    state = prevState
    state.applyChanges(changes)
    gameData = state.getState()
    lockedKeys = state.getLockedKeys()
    onceKeys = state.getOnceKeys()

    removeNode(parent, index)
    return [SKIP, index]
  }

  /**
   * Converts an `:input` directive into an Input component bound to game state.
   *
   * @param directive - The input directive node.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within its parent.
   * @returns The index of the inserted node.
   */
  const handleInput: DirectiveHandler = (directive, parent, index) => {
    if (!parent || typeof index !== 'number') return
    if (directive.type === 'textDirective') {
      const label = hasLabel(directive) ? directive.label : toString(directive)
      const key = ensureKey(label.trim(), parent, index)
      if (!key) return index
      const attrs = (directive.attributes || {}) as Record<string, unknown>
      if (Object.prototype.hasOwnProperty.call(attrs, 'class')) {
        const msg = 'class is a reserved attribute. Use className instead.'
        console.error(msg)
        addError(msg)
      }
      const classAttr =
        typeof attrs.className === 'string' ? attrs.className : ''
      const styleAttr =
        typeof attrs.style === 'string' ? attrs.style : undefined
      const placeholder =
        typeof attrs.placeholder === 'string' ? attrs.placeholder : undefined
      const typeAttr = typeof attrs.type === 'string' ? attrs.type : undefined
      const initialValue =
        typeof attrs.value === 'string'
          ? attrs.value
          : typeof attrs.defaultValue === 'string'
            ? attrs.defaultValue
            : undefined
      const props: Record<string, unknown> = { stateKey: key }
      if (classAttr) props.className = classAttr.split(/\s+/).filter(Boolean)
      if (styleAttr) props.style = styleAttr
      if (placeholder) props.placeholder = placeholder
      if (typeAttr) props.type = typeAttr
      if (initialValue) props.initialValue = initialValue
      applyAdditionalAttributes(attrs, props, [
        'className',
        'style',
        'placeholder',
        'type',
        'value',
        'defaultValue'
      ])
      const node: Parent = {
        type: 'paragraph',
        children: [],
        data: { hName: 'input', hProperties: props as Properties }
      }
      return replaceWithIndentation(directive, parent, index, [
        node as RootContent
      ])
    }
    if (directive.type === 'containerDirective') {
      const container = directive as ContainerDirective
      const label = getLabel(container)
      const key = ensureKey(label.trim(), parent, index)
      if (!key) return index
      const attrs = (container.attributes || {}) as Record<string, unknown>
      if (Object.prototype.hasOwnProperty.call(attrs, 'class')) {
        const msg = 'class is a reserved attribute. Use className instead.'
        console.error(msg)
        addError(msg)
      }
      const classAttr =
        typeof attrs.className === 'string' ? attrs.className : ''
      const styleAttr =
        typeof attrs.style === 'string' ? attrs.style : undefined
      const placeholder =
        typeof attrs.placeholder === 'string' ? attrs.placeholder : undefined
      const typeAttr = typeof attrs.type === 'string' ? attrs.type : undefined
      const initialValue =
        typeof attrs.value === 'string'
          ? attrs.value
          : typeof attrs.defaultValue === 'string'
            ? attrs.defaultValue
            : undefined
      const rawChildren = runDirectiveBlock(
        expandIndentedCode(container.children as RootContent[])
      )
      const { events, remaining } = extractEventProps(rawChildren)
      const props: Record<string, unknown> = { stateKey: key }
      if (classAttr) props.className = classAttr.split(/\s+/).filter(Boolean)
      if (styleAttr) props.style = styleAttr
      if (placeholder) props.placeholder = placeholder
      if (typeAttr) props.type = typeAttr
      if (initialValue) props.initialValue = initialValue
      if (events.onHover) props.onHover = events.onHover
      if (events.onFocus) props.onFocus = events.onFocus
      if (events.onBlur) props.onBlur = events.onBlur
      applyAdditionalAttributes(attrs, props, [
        'className',
        'style',
        'placeholder',
        'type',
        'value',
        'defaultValue'
      ])
      const node: Parent = {
        type: 'paragraph',
        children: [],
        data: { hName: 'input', hProperties: props as Properties }
      }
      const newIndex = replaceWithIndentation(directive, parent, index, [
        node as RootContent
      ])
      const markerIndex = newIndex + 1
      removeDirectiveMarker(parent, markerIndex)
      return [SKIP, newIndex]
    }
    const msg = 'input can only be used as a leaf or container directive'
    console.error(msg)
    addError(msg)
    return removeNode(parent, index)
  }

  /**
   * Converts a `:textarea` directive into a Textarea component bound to game state.
   *
   * @param directive - The textarea directive node.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within its parent.
   * @returns The index of the inserted node.
   */
  const handleTextarea: DirectiveHandler = (directive, parent, index) => {
    if (!parent || typeof index !== 'number') return
    if (directive.type === 'textDirective') {
      const label = hasLabel(directive) ? directive.label : toString(directive)
      const key = ensureKey(label.trim(), parent, index)
      if (!key) return index
      const attrs = (directive.attributes || {}) as Record<string, unknown>
      if (Object.prototype.hasOwnProperty.call(attrs, 'class')) {
        const msg = 'class is a reserved attribute. Use className instead.'
        console.error(msg)
        addError(msg)
      }
      const classAttr =
        typeof attrs.className === 'string' ? attrs.className : ''
      const styleAttr =
        typeof attrs.style === 'string' ? attrs.style : undefined
      const placeholder =
        typeof attrs.placeholder === 'string' ? attrs.placeholder : undefined
      const initialValue =
        typeof attrs.value === 'string'
          ? attrs.value
          : typeof attrs.defaultValue === 'string'
            ? attrs.defaultValue
            : undefined
      const props: Record<string, unknown> = { stateKey: key }
      if (classAttr) props.className = classAttr.split(/\s+/).filter(Boolean)
      if (styleAttr) props.style = styleAttr
      if (placeholder) props.placeholder = placeholder
      if (initialValue) props.initialValue = initialValue
      applyAdditionalAttributes(attrs, props, [
        'className',
        'style',
        'placeholder',
        'value',
        'defaultValue'
      ])
      const node: Parent = {
        type: 'paragraph',
        children: [],
        data: { hName: 'textarea', hProperties: props as Properties }
      }
      return replaceWithIndentation(directive, parent, index, [
        node as RootContent
      ])
    }
    if (directive.type === 'containerDirective') {
      const container = directive as ContainerDirective
      const label = getLabel(container)
      const key = ensureKey(label.trim(), parent, index)
      if (!key) return index
      const attrs = (container.attributes || {}) as Record<string, unknown>
      if (Object.prototype.hasOwnProperty.call(attrs, 'class')) {
        const msg = 'class is a reserved attribute. Use className instead.'
        console.error(msg)
        addError(msg)
      }
      const classAttr =
        typeof attrs.className === 'string' ? attrs.className : ''
      const styleAttr =
        typeof attrs.style === 'string' ? attrs.style : undefined
      const placeholder =
        typeof attrs.placeholder === 'string' ? attrs.placeholder : undefined
      const initialValue =
        typeof attrs.value === 'string'
          ? attrs.value
          : typeof attrs.defaultValue === 'string'
            ? attrs.defaultValue
            : undefined
      const rawChildren = runDirectiveBlock(
        expandIndentedCode(container.children as RootContent[])
      )
      const { events } = extractEventProps(rawChildren)
      const props: Record<string, unknown> = { stateKey: key }
      if (classAttr) props.className = classAttr.split(/\s+/).filter(Boolean)
      if (styleAttr) props.style = styleAttr
      if (placeholder) props.placeholder = placeholder
      if (initialValue) props.initialValue = initialValue
      if (events.onHover) props.onHover = events.onHover
      if (events.onFocus) props.onFocus = events.onFocus
      if (events.onBlur) props.onBlur = events.onBlur
      applyAdditionalAttributes(attrs, props, [
        'className',
        'style',
        'placeholder',
        'value',
        'defaultValue'
      ])
      const node: Parent = {
        type: 'paragraph',
        children: [],
        data: { hName: 'textarea', hProperties: props as Properties }
      }
      const newIndex = replaceWithIndentation(directive, parent, index, [
        node as RootContent
      ])
      const markerIndex = newIndex + 1
      removeDirectiveMarker(parent, markerIndex)
      return [SKIP, newIndex]
    }
    const msg = 'textarea can only be used as a leaf or container directive'
    console.error(msg)
    addError(msg)
    return removeNode(parent, index)
  }

  const handleOption: DirectiveHandler = (directive, parent, index) => {
    if (!parent || typeof index !== 'number') return
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const value = typeof attrs.value === 'string' ? attrs.value : undefined
    const label = typeof attrs.label === 'string' ? attrs.label : undefined
    if (!value || !label) {
      const msg = 'option requires value and label attributes'
      console.error(msg)
      addError(msg)
      return removeNode(parent, index)
    }
    if (Object.prototype.hasOwnProperty.call(attrs, 'class')) {
      const msg = 'class is a reserved attribute. Use className instead.'
      console.error(msg)
      addError(msg)
    }
    const classAttr = typeof attrs.className === 'string' ? attrs.className : ''
    const styleAttr = typeof attrs.style === 'string' ? attrs.style : undefined
    const initialValue =
      typeof attrs.value === 'string'
        ? attrs.value
        : typeof attrs.defaultValue === 'string'
          ? attrs.defaultValue
          : undefined
    const props: Record<string, unknown> = { value }
    if (classAttr) props.className = classAttr.split(/\s+/).filter(Boolean)
    if (styleAttr) props.style = styleAttr
    applyAdditionalAttributes(attrs, props, [
      'value',
      'label',
      'className',
      'style'
    ])
    const node: Parent = {
      type: 'paragraph',
      children: [{ type: 'text', value: label }],
      data: { hName: 'option', hProperties: props as Properties }
    }
    return replaceWithIndentation(directive, parent, index, [
      node as RootContent
    ])
  }

  const handleSelect: DirectiveHandler = (directive, parent, index) => {
    if (!parent || typeof index !== 'number') return
    const container = directive as ContainerDirective
    const label = getLabel(container)
    const key = ensureKey(label.trim(), parent, index)
    if (!key) return index
    const attrs = (container.attributes || {}) as Record<string, unknown>
    if (Object.prototype.hasOwnProperty.call(attrs, 'class')) {
      const msg = 'class is a reserved attribute. Use className instead.'
      console.error(msg)
      addError(msg)
    }
    const classAttr = typeof attrs.className === 'string' ? attrs.className : ''
    const styleAttr = typeof attrs.style === 'string' ? attrs.style : undefined
    const initialValue =
      typeof attrs.value === 'string'
        ? attrs.value
        : typeof attrs.defaultValue === 'string'
          ? attrs.defaultValue
          : undefined
    const rawChildren = runDirectiveBlock(
      expandIndentedCode(container.children as RootContent[])
    )
    const { events, remaining } = extractEventProps(rawChildren)
    const options = remaining.filter(node => !isWhitespaceNode(node))
    const props: Record<string, unknown> = { stateKey: key }
    if (classAttr) props.className = classAttr.split(/\s+/).filter(Boolean)
    if (styleAttr) props.style = styleAttr
    if (initialValue) props.initialValue = initialValue
    if (events.onHover) props.onHover = events.onHover
    if (events.onFocus) props.onFocus = events.onFocus
    if (events.onBlur) props.onBlur = events.onBlur
    applyAdditionalAttributes(attrs, props, [
      'className',
      'style',
      'value',
      'defaultValue'
    ])
    const node: Parent = {
      type: 'paragraph',
      children: options as RootContent[],
      data: { hName: 'select', hProperties: props as Properties }
    }
    const newIndex = replaceWithIndentation(directive, parent, index, [
      node as RootContent
    ])
    const markerIndex = newIndex + 1
    removeDirectiveMarker(parent, markerIndex)
    return [SKIP, newIndex]
  }

  const handleTrigger: DirectiveHandler = (directive, parent, index) => {
    if (!parent || typeof index !== 'number') return
    const container = directive as ContainerDirective
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    if (Object.prototype.hasOwnProperty.call(attrs, 'class')) {
      const msg = 'class is a reserved attribute. Use className instead.'
      console.error(msg)
      addError(msg)
    }
    const label =
      typeof attrs.label === 'string' ? attrs.label : getLabel(container)
    const classAttr = typeof attrs.className === 'string' ? attrs.className : ''
    const disabled =
      typeof attrs.disabled === 'string'
        ? attrs.disabled !== 'false'
        : Boolean(attrs.disabled)
    const styleAttr = typeof attrs.style === 'string' ? attrs.style : undefined
    const rawChildren = runDirectiveBlock(
      expandIndentedCode(container.children as RootContent[])
    )
    const { events, remaining } = extractEventProps(rawChildren)
    const content = JSON.stringify(stripLabel(remaining))
    const classes = classAttr.split(/\s+/).filter(Boolean)
    const node: Parent = {
      type: 'paragraph',
      children: [{ type: 'text', value: label || '' }],
      data: {
        hName: 'trigger',
        hProperties: {
          className: classes,
          content,
          disabled,
          ...(styleAttr ? { style: styleAttr } : {}),
          ...(events.onHover ? { onHover: events.onHover } : {}),
          ...(events.onFocus ? { onFocus: events.onFocus } : {}),
          ...(events.onBlur ? { onBlur: events.onBlur } : {})
        }
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
    const rawChildren = runDirectiveBlock(
      expandIndentedCode(container.children as RootContent[])
    )
    const processedChildren = stripLabel(rawChildren)
    const [filtered, invalid] = filterDirectiveChildren(
      processedChildren,
      allowed
    )
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
    let raw = ''
    let ns: string | undefined
    let key: string | undefined
    const label = hasLabel(directive) ? directive.label.trim() : undefined
    if (label) {
      raw = label
    } else {
      const children = directive.children as (RootContent & { name?: string })[]
      if (
        children.length === 2 &&
        children[0].type === 'text' &&
        children[1].type === 'textDirective'
      ) {
        ns = (children[0] as MdText).value.trim()
        key = (children[1] as DirectiveNode).name
        raw = `${ns}:${key}`
      } else if (children.length === 1 && children[0].type === 'text') {
        raw = (children[0] as MdText).value.trim()
      } else {
        raw = toString(directive).trim()
      }
    }
    if (!raw) return removeNode(parent, index)
    const { attrs } = extractAttributes(
      directive,
      parent,
      index,
      {
        count: { type: 'number' },
        fallback: { type: 'string' },
        ns: { type: 'string' },
        className: { type: 'string', expression: false },
        style: { type: 'string', expression: false }
      },
      { state: gameData }
    )
    if (attrs.ns) ns = attrs.ns
    const classAttr = typeof attrs.className === 'string' ? attrs.className : ''
    const styleAttr = typeof attrs.style === 'string' ? attrs.style : undefined
    const keyPattern = /^[A-Za-z_$][A-Za-z0-9_$]*(?::[A-Za-z0-9_.$-]+)?$/
    let props: Properties
    if (key || keyPattern.test(raw)) {
      if (!key) {
        const [nsPart, keyPart] = raw.split(':', 2)
        key = keyPart ?? nsPart
        if (keyPart !== undefined) ns = nsPart
      }
      props = { 'data-i18n-key': key }
      if (ns) props['data-i18n-ns'] = ns
    } else {
      props = { 'data-i18n-expr': raw }
    }
    const rawAttrs = { ...(directive.attributes || {}) } as Record<
      string,
      unknown
    >
    if (Object.prototype.hasOwnProperty.call(rawAttrs, 'class')) {
      const msg = 'class is a reserved attribute. Use className instead.'
      console.error(msg)
      addError(msg)
    }
    const rawFallback = rawAttrs.fallback as string | undefined
    delete rawAttrs.count
    delete rawAttrs.fallback
    delete rawAttrs.ns
    delete rawAttrs.className
    delete rawAttrs.style
    const vars: Record<string, unknown> = {}
    for (const [name, rawVal] of Object.entries(rawAttrs)) {
      if (rawVal == null) continue
      if (typeof rawVal === 'string') {
        try {
          const value = evalExpression(rawVal, gameData)
          vars[name] = value ?? rawVal
        } catch (error) {
          const msg = `Failed to evaluate t directive var: ${rawVal}`
          console.error(msg, error)
          addError(msg)
          const match = rawVal.match(QUOTE_PATTERN)
          vars[name] = match ? match[2] : rawVal
        }
      } else {
        vars[name] = rawVal
      }
    }
    let fallback: string | undefined
    if (typeof rawFallback === 'string') {
      const trimmed = rawFallback.trim()
      const match = trimmed.match(QUOTE_PATTERN)
      const inner = match ? match[2] : trimmed
      try {
        const shouldInterpolate = !!match || trimmed.includes('${')
        fallback = shouldInterpolate
          ? interpolateString(inner, gameData)
          : ((): string | undefined => {
              const val = evalExpression(inner, gameData)
              return val != null ? String(val) : undefined
            })()
      } catch (error) {
        const msg = `Failed to evaluate t directive fallback: ${rawFallback}`
        console.error(msg, error)
        addError(msg)
        fallback = match ? inner : trimmed
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
      let nsVal = props['data-i18n-ns'] as string | undefined
      let tKey = props['data-i18n-key'] as string | undefined
      if (!tKey && 'data-i18n-expr' in props) {
        try {
          const result = evalExpression(
            props['data-i18n-expr'] as string,
            gameData
          )
          if (typeof result === 'string') {
            if (!nsVal && result.includes(':')) {
              ;[nsVal, tKey] = result.split(':', 2)
            } else {
              tKey = result
            }
          }
        } catch (error) {
          const msg = `Failed to evaluate t directive key expression: ${props['data-i18n-expr']}`
          console.error(msg, error)
          addError(msg)
          tKey = undefined
        }
      }
      const options = {
        ...vars,
        ...getTranslationOptions({ ns: nsVal, count: attrs.count })
      }
      if (inLink && tKey) {
        const text = i18next.t(tKey, options)
        if (prev && next) {
          prev.value += text + next.value
          parent.children.splice(index, 2)
          return index - 1
        }
        return replaceWithIndentation(directive, parent, index, [
          { type: 'text', value: text }
        ])
      }
      if (nsVal) props['data-i18n-ns'] = nsVal
      if (tKey) props['data-i18n-key'] = tKey
      if (attrs.count !== undefined) props['data-i18n-count'] = attrs.count
      if (Object.keys(vars).length > 0)
        props['data-i18n-vars'] = JSON.stringify(vars)
      if (fallback !== undefined) props['data-i18n-fallback'] = fallback
      if (classAttr) props.className = classAttr
      if (styleAttr) props.style = styleAttr
      const node: MdText = {
        type: 'text',
        value: '0', // non-empty placeholder required for mdast conversion
        data: { hName: 'translate', hProperties: props }
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
   * Preloads an audio track into the AudioManager cache.
   *
   * @param directive - The directive node being processed.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within the parent.
   * @returns The index of the removed node.
   */
  const handlePreloadAudio: DirectiveHandler = (directive, parent, index) => {
    const { attrs } = extractAttributes(directive, parent, index, {
      id: { type: 'string' },
      src: { type: 'string' }
    })
    const id = hasLabel(directive) ? directive.label : attrs.id
    const src = attrs.src
    if (id && src) {
      audio.load(id, src)
    } else {
      addError('preloadAudio directive requires an id/label and src')
    }
    return removeNode(parent, index)
  }

  /**
   * Preloads an image asset into cache.
   *
   * @param directive - The directive node being processed.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within the parent.
   * @returns The index of the removed node.
   */
  const handlePreloadImage: DirectiveHandler = (directive, parent, index) => {
    const { attrs } = extractAttributes(directive, parent, index, {
      id: { type: 'string' },
      src: { type: 'string' }
    })
    const id = hasLabel(directive) ? directive.label : attrs.id
    const src = attrs.src
    if (id && src) {
      void images.load(id, src)
    } else {
      addError('preloadImage directive requires an id/label and src')
    }
    return removeNode(parent, index)
  }

  /**
   * Plays a sound effect or preloaded audio track.
   *
   * @param directive - The directive node being processed.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within the parent.
   * @returns The index of the removed node.
   */
  const handleSound: DirectiveHandler = (directive, parent, index) => {
    const { attrs } = extractAttributes(directive, parent, index, {
      id: { type: 'string' },
      src: { type: 'string' },
      volume: { type: 'number' },
      delay: { type: 'number' }
    })
    const volume = typeof attrs.volume === 'number' ? attrs.volume : undefined
    const delay = typeof attrs.delay === 'number' ? attrs.delay : undefined
    runWithIdOrSrc(
      directive,
      attrs,
      (id, opts) => audio.playSfx(id, opts),
      { volume, delay },
      'sound directive requires id or src',
      addError
    )
    return removeNode(parent, index)
  }

  /**
   * Controls background music playback, allowing start, stop and fade.
   *
   * @param directive - The directive node being processed.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within the parent.
   * @returns The index of the removed node.
   */
  const handleBgm: DirectiveHandler = (directive, parent, index) => {
    const { attrs } = extractAttributes(directive, parent, index, {
      id: { type: 'string' },
      src: { type: 'string' },
      stop: { type: 'boolean' },
      volume: { type: 'number' },
      loop: { type: 'boolean' },
      fade: { type: 'number' }
    })
    const stop = attrs.stop === true
    const volume = typeof attrs.volume === 'number' ? attrs.volume : undefined
    const loop = attrs.loop === false ? false : true
    const fade = typeof attrs.fade === 'number' ? attrs.fade : undefined
    if (stop) {
      audio.stopBgm(fade)
    } else {
      runWithIdOrSrc(
        directive,
        attrs,
        (id, opts) => audio.playBgm(id, opts),
        { volume, loop, fade },
        'bgm directive requires id or src',
        addError
      )
    }
    return removeNode(parent, index)
  }

  /**
   * Adjusts global audio volume levels for BGM and sound effects.
   *
   * @param directive - The directive node being processed.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within the parent.
   * @returns The index of the removed node.
   */
  const handleVolume: DirectiveHandler = (directive, parent, index) => {
    const { attrs } = extractAttributes(directive, parent, index, {
      bgm: { type: 'number' },
      sfx: { type: 'number' }
    })
    if (typeof attrs.bgm === 'number') {
      audio.setBgmVolume(attrs.bgm)
    }
    if (typeof attrs.sfx === 'number') {
      audio.setSfxVolume(attrs.sfx)
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
   * keys specified in {@link exclude}. Emits an error if the `class` attribute
   * is encountered, as it is reserved.
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
      if (key === 'class') {
        const msg = 'class is a reserved attribute. Use className instead.'
        console.error(msg)
        addError(msg)
        throw new Error(msg)
      }
      if (key === 'classes' || key === 'layerClass' || key === 'layerClasses')
        continue
      if (!exclude.includes(key)) {
        target[key] = source[key]
      }
    }
  }

  /**
   * Merges preset attributes with raw directive attributes.
   *
   * @param preset - Attributes defined in the preset.
   * @param raw - Attributes provided on the directive.
   * @returns Combined attribute map with directive attributes taking precedence.
   */
  const mergeAttrs = (
    preset: Record<string, unknown> | undefined,
    raw: Record<string, unknown>
  ): Record<string, unknown> => ({ ...(preset || {}), ...raw })

  /**
   * Stores attribute presets for reuse by other directives.
   *
   * @param directive - The preset directive node.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within the parent.
   * @returns The index of the removed node.
   */
  const handlePreset: DirectiveHandler = (directive, parent, index) => {
    if (!parent || typeof index !== 'number') return
    const { attrs: presetAttrs } = extractAttributes(
      directive,
      parent,
      index,
      {
        type: { type: 'string', required: true },
        name: { type: 'string', required: true }
      },
      { label: false }
    )
    const target = String(presetAttrs.type)
    const name = String(presetAttrs.name)
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const rawAttrs = { ...attrs }
    delete rawAttrs.type
    delete rawAttrs.name
    const parsedAttrs: Record<string, unknown> = { ...rawAttrs }
    for (const key of Object.keys(parsedAttrs)) {
      const val = parsedAttrs[key]
      if (
        typeof val === 'number' ||
        (typeof val === 'string' && NUMERIC_PATTERN.test(val))
      ) {
        parsedAttrs[key] = parseNumericValue(val)
      }
    }
    if (!presetsRef.current[target]) presetsRef.current[target] = {}
    presetsRef.current[target][name] = parsedAttrs
    parent.children.splice(index, 1)
    return index
  }

  /**
   * Creates a handler for container directives that converts directive blocks
   * into corresponding hast nodes.
   *
   * @param hName - Tag name or resolver function for the output element.
   * @param schema - Attribute extraction schema.
   * @param mapProps - Maps parsed and raw attributes to element props.
   * @param transform - Optional transformer applied to processed children.
   * @param beforeRemove - Optional callback executed before removing the
   * directive's closing marker; useful for cleaning up sibling nodes based on
   * the marker position.
   * @returns Directive handler for the container.
   */
  const createContainerHandler =
    <S extends AttributeSchema>(
      hName: string | ((attrs: ExtractedAttrs<S>) => string),
      schema: S,
      mapProps: (
        attrs: ExtractedAttrs<S>,
        raw: Record<string, unknown>
      ) => Record<string, unknown>,
      transform?: (
        children: RootContent[],
        attrs: ExtractedAttrs<S>
      ) => RootContent[],
      beforeRemove?: (parent: Parent, markerIndex: number) => void
    ): DirectiveHandler =>
    (directive, parent, index) => {
      if (!parent || typeof index !== 'number') return
      if (directive.type !== 'containerDirective') {
        const msg = `${directive.name} can only be used as a container directive`
        console.error(msg)
        addError(msg)
        return removeNode(parent, index)
      }
      const container = directive as ContainerDirective
      const { attrs } = extractAttributes<S>(directive, parent, index, schema)
      const rawAttrs = (directive.attributes || {}) as Record<string, unknown>
      const processed = runDirectiveBlock(
        expandIndentedCode(container.children as RootContent[]),
        handlersRef.current
      )
      const stripped = stripLabel(processed)
      const children = transform ? transform(stripped, attrs) : stripped
      const tag = typeof hName === 'function' ? hName(attrs) : hName
      const node: Parent = {
        type: 'paragraph',
        children,
        data: {
          hName: tag,
          hProperties: mapProps(attrs, rawAttrs) as Properties
        }
      }
      const newIndex = replaceWithIndentation(directive, parent, index, [
        node as RootContent
      ])
      const markerIndex = newIndex + 1
      if (beforeRemove) beforeRemove(parent, markerIndex)
      removeDirectiveMarker(parent, markerIndex)
      return [SKIP, newIndex]
    }

  /** Schema describing supported reveal directive attributes. */
  const revealSchema = {
    at: { type: 'number' },
    exitAt: { type: 'number' },
    enter: { type: 'string' },
    exit: { type: 'string' },
    enterDir: { type: 'string' },
    exitDir: { type: 'string' },
    enterDuration: { type: 'number' },
    exitDuration: { type: 'number' },
    interruptBehavior: { type: 'string' },
    from: { type: 'string', expression: false }
  } as const

  type RevealSchema = typeof revealSchema
  type RevealAttrs = ExtractedAttrs<RevealSchema>

  const REVEAL_EXCLUDES = [
    'at',
    'exitAt',
    'enter',
    'exit',
    'enterDir',
    'exitDir',
    'enterDuration',
    'exitDuration',
    'interruptBehavior'
  ] as const

  /**
   * Builds a transition object from a base value and optional extras.
   *
   * @param base - Transition key or existing configuration.
   * @param dir - Optional direction to apply.
   * @param duration - Optional duration in milliseconds.
   * @param delay - Optional delay before the transition starts.
   * @param easing - Optional easing function to apply.
   * @returns A transition object when a base is provided.
   */
  const buildTransition = (
    base?: Transition | Transition['type'],
    dir?: Direction,
    duration?: number,
    delay?: number,
    easing?: string
  ): Transition | undefined => {
    if (!base) return undefined
    const t: Transition =
      typeof base === 'string' ? { type: base } : { ...base }
    if (dir) t.dir = dir
    if (typeof duration === 'number') t.duration = duration
    if (typeof delay === 'number') t.delay = delay
    if (easing) t.easing = easing
    return t
  }

  /** Schema describing supported slide directive attributes. */
  const slideSchema = {
    transition: { type: 'string' },
    enter: { type: 'string' },
    exit: { type: 'string' },
    enterDir: { type: 'string' },
    exitDir: { type: 'string' },
    enterDuration: { type: 'number' },
    exitDuration: { type: 'number' },
    enterDelay: { type: 'number' },
    exitDelay: { type: 'number' },
    enterEasing: { type: 'string', expression: false },
    exitEasing: { type: 'string', expression: false },
    steps: { type: 'number' },
    onEnter: { type: 'string' },
    onExit: { type: 'string' },
    from: { type: 'string', expression: false }
  } as const

  type SlideSchema = typeof slideSchema
  type SlideAttrs = ExtractedAttrs<SlideSchema>

  const SLIDE_EXCLUDES = [
    'transition',
    'enter',
    'exit',
    'enterDir',
    'exitDir',
    'enterDuration',
    'exitDuration',
    'enterDelay',
    'exitDelay',
    'enterEasing',
    'exitEasing',
    'steps',
    'onEnter',
    'onExit'
  ] as const

  /** Schema describing supported layer directive attributes. */
  const layerSchema = {
    x: { type: 'number' },
    y: { type: 'number' },
    w: { type: 'number' },
    h: { type: 'number' },
    z: { type: 'number' },
    rotate: { type: 'number' },
    scale: { type: 'number' },
    anchor: { type: 'string' },
    className: { type: 'string' },
    from: { type: 'string', expression: false }
  } as const

  type LayerSchema = typeof layerSchema
  type LayerAttrs = ExtractedAttrs<LayerSchema>

  const LAYER_EXCLUDES = [
    'x',
    'y',
    'w',
    'h',
    'z',
    'rotate',
    'scale',
    'anchor'
  ] as const

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
    align: { type: 'string' },
    size: { type: 'number' },
    weight: { type: 'number' },
    lineHeight: { type: 'number' },
    color: { type: 'string' },
    from: { type: 'string', expression: false }
  } as const

  type TextSchema = typeof textSchema
  type TextAttrs = ExtractedAttrs<TextSchema>

  /** Schema describing supported image directive attributes. */
  const imageSchema = {
    x: { type: 'number' },
    y: { type: 'number' },
    w: { type: 'number' },
    h: { type: 'number' },
    z: { type: 'number' },
    rotate: { type: 'number' },
    scale: { type: 'number' },
    anchor: { type: 'string' },
    src: { type: 'string', required: true },
    alt: { type: 'string' },
    style: { type: 'string' },
    className: { type: 'string' },
    layerClassName: { type: 'string' },
    from: { type: 'string', expression: false }
  } as const

  type ImageSchema = typeof imageSchema
  type ImageAttrs = ExtractedAttrs<ImageSchema>

  /** Schema describing supported shape directive attributes. */
  const shapeSchema = {
    x: { type: 'number' },
    y: { type: 'number' },
    w: { type: 'number' },
    h: { type: 'number' },
    z: { type: 'number' },
    rotate: { type: 'number' },
    scale: { type: 'number' },
    anchor: { type: 'string' },
    type: { type: 'string', required: true },
    points: { type: 'string' },
    x1: { type: 'number' },
    y1: { type: 'number' },
    x2: { type: 'number' },
    y2: { type: 'number' },
    stroke: { type: 'string' },
    strokeWidth: { type: 'number' },
    fill: { type: 'string' },
    radius: { type: 'number' },
    shadow: { type: 'boolean' },
    className: { type: 'string' },
    layerClassName: { type: 'string' },
    style: { type: 'string' },
    from: { type: 'string', expression: false }
  } as const

  type ShapeSchema = typeof shapeSchema
  type ShapeAttrs = ExtractedAttrs<ShapeSchema>

  /**
   * Converts `:::reveal` directives into SlideReveal elements.
   *
   * @param directive - The reveal directive node.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within its parent.
   * @returns Visitor instructions after replacement.
   */
  const handleReveal = createContainerHandler(
    'reveal',
    revealSchema,
    (attrs, raw) => {
      const props: Record<string, unknown> = {}
      const preset = attrs.from
        ? (presetsRef.current['reveal']?.[String(attrs.from)] as
            | (Partial<RevealAttrs> & Record<string, unknown>)
            | undefined)
        : undefined
      let enter = buildTransition(
        preset?.enter as Transition | Transition['type'] | undefined,
        preset?.enterDir as Direction | undefined,
        preset?.enterDuration
      )
      let exit = buildTransition(
        preset?.exit as Transition | Transition['type'] | undefined,
        preset?.exitDir as Direction | undefined,
        preset?.exitDuration
      )
      if (preset) {
        if (typeof preset.at === 'number') props.at = preset.at
        if (typeof preset.exitAt === 'number') props.exitAt = preset.exitAt
        if (preset.interruptBehavior)
          props.interruptBehavior = preset.interruptBehavior
        applyAdditionalAttributes(preset, props, REVEAL_EXCLUDES)
      }
      if (typeof attrs.at === 'number') props.at = attrs.at
      if (typeof attrs.exitAt === 'number') props.exitAt = attrs.exitAt
      enter = buildTransition(
        (attrs.enter ?? enter?.type) as
          | Transition
          | Transition['type']
          | undefined,
        (attrs.enterDir as Direction | undefined) ?? enter?.dir,
        attrs.enterDuration ?? enter?.duration
      )
      exit = buildTransition(
        (attrs.exit ?? exit?.type) as
          | Transition
          | Transition['type']
          | undefined,
        (attrs.exitDir as Direction | undefined) ?? exit?.dir,
        attrs.exitDuration ?? exit?.duration
      )
      if (enter) props.enter = enter
      if (exit) props.exit = exit
      if (attrs.interruptBehavior)
        props.interruptBehavior = attrs.interruptBehavior
      const mergedRaw = mergeAttrs(preset, raw)
      applyAdditionalAttributes(mergedRaw, props, [...REVEAL_EXCLUDES, 'from'])
      return props
    }
  )

  /**
   * Converts a `:::layer` directive into a Layer element.
   *
   * @param directive - The layer directive node.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within its parent.
   * @returns Visitor instructions after replacement.
   */
  const handleLayer = createContainerHandler(
    'layer',
    layerSchema,
    (attrs, raw) => {
      const props: Record<string, unknown> = {}
      const preset = attrs.from
        ? presetsRef.current['layer']?.[String(attrs.from)]
        : undefined
      if (preset) {
        if (typeof preset.x === 'number') props.x = preset.x
        if (typeof preset.y === 'number') props.y = preset.y
        if (typeof preset.w === 'number') props.w = preset.w
        if (typeof preset.h === 'number') props.h = preset.h
        if (typeof preset.z === 'number') props.z = preset.z
        if (typeof preset.rotate === 'number') props.rotate = preset.rotate
        if (typeof preset.scale === 'number') props.scale = preset.scale
        if (preset.anchor) props.anchor = preset.anchor
        applyAdditionalAttributes(preset, props, LAYER_EXCLUDES)
      }
      if (typeof attrs.x === 'number') props.x = attrs.x
      if (typeof attrs.y === 'number') props.y = attrs.y
      if (typeof attrs.w === 'number') props.w = attrs.w
      if (typeof attrs.h === 'number') props.h = attrs.h
      if (typeof attrs.z === 'number') props.z = attrs.z
      if (typeof attrs.rotate === 'number') props.rotate = attrs.rotate
      if (typeof attrs.scale === 'number') props.scale = attrs.scale
      if (attrs.anchor) props.anchor = attrs.anchor
      const mergedRaw = mergeAttrs(preset, raw)
      props['data-testid'] = 'layer'
      const classAttr =
        typeof attrs.className === 'string'
          ? attrs.className
          : typeof mergedRaw.className === 'string'
            ? mergedRaw.className
            : undefined
      if (classAttr) props.className = classAttr
      applyAdditionalAttributes(mergedRaw, props, [
        ...LAYER_EXCLUDES,
        'from',
        'layerClassName'
      ])
      return props
    }
  )

  /**
   * Converts a `:text` directive into a SlideText element.
   *
   * @param directive - The text directive node.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within its parent.
   * @returns The index of the inserted node.
   */
  const handleText: DirectiveHandler = (directive, parent, index) => {
    if (!parent || typeof index !== 'number') return
    if (directive.type !== 'containerDirective') {
      const msg = 'text can only be used as a container directive'
      console.error(msg)
      addError(msg)
      return removeNode(parent, index)
    }
    const container = directive as ContainerDirective
    const { attrs } = extractAttributes<TextSchema>(
      directive,
      parent,
      index,
      textSchema
    )
    const raw = (directive.attributes || {}) as Record<string, unknown>
    const preset = attrs.from
      ? presetsRef.current['text']?.[String(attrs.from)]
      : undefined
    const mergedRaw = mergeAttrs(preset, raw)
    const mergedAttrs = mergeAttrs(
      preset,
      attrs as unknown as Record<string, unknown>
    ) as TextAttrs & Record<string, unknown>
    const tagName = mergedAttrs.as ? String(mergedAttrs.as) : 'p'
    const style: string[] = []
    style.push('position:absolute')
    if (typeof mergedAttrs.x === 'number') style.push(`left:${mergedAttrs.x}px`)
    if (typeof mergedAttrs.y === 'number') style.push(`top:${mergedAttrs.y}px`)
    if (typeof mergedAttrs.w === 'number')
      style.push(`width:${mergedAttrs.w}px`)
    if (typeof mergedAttrs.h === 'number')
      style.push(`height:${mergedAttrs.h}px`)
    if (typeof mergedAttrs.z === 'number')
      style.push(`z-index:${mergedAttrs.z}`)
    const transforms: string[] = []
    if (typeof mergedAttrs.rotate === 'number')
      transforms.push(`rotate(${mergedAttrs.rotate}deg)`)
    if (typeof mergedAttrs.scale === 'number')
      transforms.push(`scale(${mergedAttrs.scale})`)
    if (transforms.length) style.push(`transform:${transforms.join(' ')}`)
    if (mergedAttrs.anchor && mergedAttrs.anchor !== 'top-left') {
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
      const origin = originMap[mergedAttrs.anchor]
      if (origin) style.push(`transform-origin:${origin}`)
    }
    if (mergedAttrs.align) style.push(`text-align:${mergedAttrs.align}`)
    if (typeof mergedAttrs.size === 'number')
      style.push(`font-size:${mergedAttrs.size}px`)
    if (typeof mergedAttrs.weight === 'number')
      style.push(`font-weight:${mergedAttrs.weight}`)
    if (typeof mergedAttrs.lineHeight === 'number')
      style.push(`line-height:${mergedAttrs.lineHeight}`)
    if (mergedAttrs.color) style.push(`color:${mergedAttrs.color}`)
    const rawStyle = mergedRaw.style
    if (rawStyle) {
      if (typeof rawStyle === 'string') {
        style.push(rawStyle)
      } else if (typeof rawStyle === 'object') {
        const entries = Object.entries(rawStyle as Record<string, unknown>).map(
          ([k, v]) => `${k}:${v}`
        )
        style.push(entries.join(';'))
      }
    }
    const props: Record<string, unknown> = {}
    if (typeof mergedAttrs.x === 'number') props.x = mergedAttrs.x
    if (typeof mergedAttrs.y === 'number') props.y = mergedAttrs.y
    if (typeof mergedAttrs.w === 'number') props.w = mergedAttrs.w
    if (typeof mergedAttrs.h === 'number') props.h = mergedAttrs.h
    if (typeof mergedAttrs.z === 'number') props.z = mergedAttrs.z
    if (typeof mergedAttrs.rotate === 'number')
      props.rotate = mergedAttrs.rotate
    if (typeof mergedAttrs.scale === 'number') props.scale = mergedAttrs.scale
    if (mergedAttrs.anchor) props.anchor = mergedAttrs.anchor
    if (style.length) props.style = style.join(';')
    const classAttr =
      typeof mergedRaw.className === 'string' ? mergedRaw.className : undefined
    const layerClassAttr =
      typeof mergedRaw.layerClassName === 'string'
        ? mergedRaw.layerClassName
        : undefined
    const classes = ['text-base', 'font-normal']
    if (classAttr) classes.unshift(classAttr)
    props.className = classes.join(' ')
    if (layerClassAttr) props.layerClassName = layerClassAttr
    props['data-component'] = 'slideText'
    props['data-as'] = tagName
    applyAdditionalAttributes(mergedRaw, props, [
      'x',
      'y',
      'w',
      'h',
      'z',
      'rotate',
      'scale',
      'anchor',
      'as',
      'align',
      'size',
      'weight',
      'lineHeight',
      'color',
      'style',
      'className',
      'layerClassName',
      'from'
    ])
    const processed = runDirectiveBlock(
      expandIndentedCode(container.children as RootContent[]),
      handlersRef.current
    )
    const stripped = stripLabel(processed)
    const content = toString(stripped).trim()
    const node: Parent = {
      type: 'paragraph',
      children: [{ type: 'text', value: content } as RootContent],
      data: { hName: tagName, hProperties: props as Properties }
    }
    return replaceWithIndentation(directive, parent, index, [
      node as RootContent
    ])
  }

  /**
   * Converts a `:image` directive into a SlideImage element.
   *
   * @param directive - The image directive node.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within its parent.
   * @returns The index of the inserted node.
   */
  const handleImage: DirectiveHandler = (directive, parent, index) => {
    if (!parent || typeof index !== 'number') return
    if (directive.type !== 'textDirective') {
      const msg = 'image can only be used as a leaf directive'
      console.error(msg)
      addError(msg)
      return removeNode(parent, index)
    }
    const { attrs } = extractAttributes<ImageSchema>(
      directive,
      parent,
      index,
      imageSchema
    )
    const raw = (directive.attributes || {}) as Record<string, unknown>
    const preset = attrs.from
      ? presetsRef.current['image']?.[String(attrs.from)]
      : undefined
    const mergedRaw = mergeAttrs(preset, raw)
    const mergedAttrs = mergeAttrs(
      preset,
      attrs as unknown as Record<string, unknown>
    ) as ImageAttrs & Record<string, unknown>
    const props: Record<string, unknown> = { src: mergedAttrs.src }
    if (typeof mergedAttrs.x === 'number') props.x = mergedAttrs.x
    if (typeof mergedAttrs.y === 'number') props.y = mergedAttrs.y
    if (typeof mergedAttrs.w === 'number') props.w = mergedAttrs.w
    if (typeof mergedAttrs.h === 'number') props.h = mergedAttrs.h
    if (typeof mergedAttrs.z === 'number') props.z = mergedAttrs.z
    if (typeof mergedAttrs.rotate === 'number')
      props.rotate = mergedAttrs.rotate
    if (typeof mergedAttrs.scale === 'number') props.scale = mergedAttrs.scale
    if (mergedAttrs.anchor) props.anchor = mergedAttrs.anchor
    if (mergedAttrs.alt) props.alt = mergedAttrs.alt
    if (mergedAttrs.style) props.style = mergedAttrs.style
    if (mergedAttrs.className) props.className = mergedAttrs.className
    if (mergedAttrs.layerClassName)
      props.layerClassName = mergedAttrs.layerClassName
    applyAdditionalAttributes(mergedRaw, props, [
      'x',
      'y',
      'w',
      'h',
      'z',
      'rotate',
      'scale',
      'anchor',
      'src',
      'alt',
      'style',
      'className',
      'layerClassName',
      'from'
    ])
    const node: Parent = {
      type: 'paragraph',
      children: [],
      data: { hName: 'slideImage', hProperties: props as Properties }
    }
    return replaceWithIndentation(directive, parent, index, [
      node as RootContent
    ])
  }

  /**
   * Converts a `:shape` directive into a SlideShape element.
   *
   * @param directive - The shape directive node.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within its parent.
   * @returns The index of the inserted node.
   */
  const handleShape: DirectiveHandler = (directive, parent, index) => {
    if (!parent || typeof index !== 'number') return
    if (directive.type !== 'textDirective') {
      const msg = 'shape can only be used as a leaf directive'
      console.error(msg)
      addError(msg)
      return removeNode(parent, index)
    }
    const { attrs } = extractAttributes<ShapeSchema>(
      directive,
      parent,
      index,
      shapeSchema
    )
    const raw = (directive.attributes || {}) as Record<string, unknown>
    const preset = attrs.from
      ? presetsRef.current['shape']?.[String(attrs.from)]
      : undefined
    const mergedRaw = mergeAttrs(preset, raw)
    const mergedAttrs = mergeAttrs(
      preset,
      attrs as unknown as Record<string, unknown>
    ) as ShapeAttrs & Record<string, unknown>
    const props: Record<string, unknown> = { type: mergedAttrs.type }
    if (typeof mergedAttrs.x === 'number') props.x = mergedAttrs.x
    if (typeof mergedAttrs.y === 'number') props.y = mergedAttrs.y
    if (typeof mergedAttrs.w === 'number') props.w = mergedAttrs.w
    if (typeof mergedAttrs.h === 'number') props.h = mergedAttrs.h
    if (typeof mergedAttrs.z === 'number') props.z = mergedAttrs.z
    if (typeof mergedAttrs.rotate === 'number')
      props.rotate = mergedAttrs.rotate
    if (typeof mergedAttrs.scale === 'number') props.scale = mergedAttrs.scale
    if (mergedAttrs.anchor) props.anchor = mergedAttrs.anchor
    if (mergedAttrs.points) props.points = mergedAttrs.points
    if (typeof mergedAttrs.x1 === 'number') props.x1 = mergedAttrs.x1
    if (typeof mergedAttrs.y1 === 'number') props.y1 = mergedAttrs.y1
    if (typeof mergedAttrs.x2 === 'number') props.x2 = mergedAttrs.x2
    if (typeof mergedAttrs.y2 === 'number') props.y2 = mergedAttrs.y2
    if (mergedAttrs.stroke) props.stroke = mergedAttrs.stroke
    if (typeof mergedAttrs.strokeWidth === 'number')
      props.strokeWidth = mergedAttrs.strokeWidth
    if (mergedAttrs.fill) props.fill = mergedAttrs.fill
    if (typeof mergedAttrs.radius === 'number')
      props.radius = mergedAttrs.radius
    if (typeof mergedAttrs.shadow === 'boolean')
      props.shadow = mergedAttrs.shadow
    if (mergedAttrs.style) props.style = mergedAttrs.style
    if (mergedAttrs.className) props.className = mergedAttrs.className
    if (mergedAttrs.layerClassName)
      props.layerClassName = mergedAttrs.layerClassName
    applyAdditionalAttributes(mergedRaw, props, [
      'x',
      'y',
      'w',
      'h',
      'z',
      'rotate',
      'scale',
      'anchor',
      'type',
      'points',
      'x1',
      'y1',
      'x2',
      'y2',
      'stroke',
      'strokeWidth',
      'fill',
      'radius',
      'shadow',
      'style',
      'className',
      'layerClassName',
      'from'
    ])
    const node: Parent = {
      type: 'paragraph',
      children: [],
      data: { hName: 'slideShape', hProperties: props as Properties }
    }
    return replaceWithIndentation(directive, parent, index, [
      node as RootContent
    ])
  }

  /**
   * Builds a props object for the Slide component from extracted attributes.
   *
   * @param attrs - Extracted slide attributes.
   * @returns Slide props object.
   */
  const buildSlideProps = (
    attrs: SlideAttrs,
    raw: Record<string, unknown> = {}
  ): Record<string, unknown> => {
    const props: Record<string, unknown> = {}
    const preset = attrs.from
      ? (presetsRef.current['slide']?.[String(attrs.from)] as
          | (Partial<SlideAttrs> & Record<string, unknown>)
          | undefined)
      : undefined
    let enter = buildTransition(
      (preset?.enter ?? preset?.transition) as
        | Transition
        | Transition['type']
        | undefined,
      preset?.enterDir as Direction | undefined,
      preset?.enterDuration,
      preset?.enterDelay,
      preset?.enterEasing
    )
    let exit = buildTransition(
      (preset?.exit ?? preset?.transition) as
        | Transition
        | Transition['type']
        | undefined,
      preset?.exitDir as Direction | undefined,
      preset?.exitDuration,
      preset?.exitDelay,
      preset?.exitEasing
    )
    if (preset) {
      if (typeof preset.steps === 'number') props.steps = preset.steps
      if (preset.onEnter) props.onEnter = preset.onEnter
      if (preset.onExit) props.onExit = preset.onExit
    }
    enter = buildTransition(
      (attrs.enter ?? attrs.transition ?? enter?.type) as
        | Transition
        | Transition['type']
        | undefined,
      (attrs.enterDir as Direction | undefined) ?? enter?.dir,
      attrs.enterDuration ?? enter?.duration,
      attrs.enterDelay ?? enter?.delay,
      attrs.enterEasing ?? enter?.easing
    )
    exit = buildTransition(
      (attrs.exit ?? attrs.transition ?? exit?.type) as
        | Transition
        | Transition['type']
        | undefined,
      (attrs.exitDir as Direction | undefined) ?? exit?.dir,
      attrs.exitDuration ?? exit?.duration,
      attrs.exitDelay ?? exit?.delay,
      attrs.exitEasing ?? exit?.easing
    )
    if (enter || exit) {
      props.transition = {
        ...(enter ? { enter } : {}),
        ...(exit ? { exit } : {})
      }
    }
    if (typeof attrs.steps === 'number') props.steps = attrs.steps
    if (attrs.onEnter) props.onEnter = attrs.onEnter
    if (attrs.onExit) props.onExit = attrs.onExit
    const mergedRaw = mergeAttrs(preset, raw)
    applyAdditionalAttributes(mergedRaw, props, [...SLIDE_EXCLUDES, 'from'])
    return props
  }

  const DECK_EXCLUDES = [
    'size',
    'transition',
    'theme',
    'autoplay',
    'autoplayDelay',
    'pause'
  ] as const

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
    if (directive.type !== 'containerDirective') {
      const msg = 'deck can only be used as a container directive'
      console.error(msg)
      addError(msg)
      return removeNode(parent, index)
    }
    const container = directive as ContainerDirective

    const { attrs: deckAttrs } = extractAttributes(
      directive,
      parent,
      index,
      {
        size: { type: 'string' },
        transition: { type: 'string' },
        theme: { type: 'string' },
        from: { type: 'string', expression: false },
        autoplay: { type: 'boolean' },
        autoplayDelay: { type: 'number' },
        pause: { type: 'boolean' }
      },
      { label: false }
    )

    const deckProps: Record<string, unknown> = {}
    if (deckAttrs.from) {
      const preset = presetsRef.current['deck']?.[String(deckAttrs.from)]
      if (preset) {
        if (typeof preset.size === 'string')
          deckProps.size = parseDeckSize(preset.size as string)
        if (preset.transition) deckProps.transition = preset.transition
        if (typeof preset.theme !== 'undefined') {
          const t = parseThemeValue(preset.theme)
          if (t) deckProps.theme = t
        }
        applyAdditionalAttributes(preset, deckProps, DECK_EXCLUDES)
      }
    }
    if (typeof deckAttrs.size === 'string') {
      deckProps.size = parseDeckSize(deckAttrs.size)
    }
    if (deckAttrs.transition) deckProps.transition = deckAttrs.transition
    if (typeof deckAttrs.theme !== 'undefined') {
      const theme = parseThemeValue(deckAttrs.theme)
      if (theme) deckProps.theme = theme
    }
    if (deckAttrs.autoplay) {
      deckProps.autoAdvanceMs =
        typeof deckAttrs.autoplayDelay === 'number'
          ? deckAttrs.autoplayDelay
          : 3000
      if (deckAttrs.pause) deckProps.autoAdvancePaused = true
    }
    const rawDeckAttrs = (directive.attributes || {}) as Record<string, unknown>
    applyAdditionalAttributes(rawDeckAttrs, deckProps, [
      ...DECK_EXCLUDES,
      'from'
    ])

    const slides: Parent[] = []

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
      node =>
        !isMarkerParagraph(node as RootContent) &&
        !isWhitespaceNode(node as RootContent)
    )

    const children: RootContent[] = stripLabel(
      runDirectiveBlock(
        expandIndentedCode([
          ...(container.children as RootContent[]),
          ...following
        ])
      )
    ).filter(
      child =>
        !isMarkerParagraph(child as RootContent) &&
        !isWhitespaceNode(child as RootContent)
    )
    let pendingAttrs: Record<string, unknown> = {}
    let pendingNodes: RootContent[] = []

    /**
     * Finalizes the currently buffered slide content and adds it to the deck.
     * Removes any trailing directive markers before running the remark
     * pipeline so stray markers do not render in the output. When buffered
     * content has no slide attributes and at least one slide already exists,
     * the nodes are merged into the previous slide instead of creating a new
     * one. This prevents stray directives, such as `:::reveal`, from being
     * lifted to the deck level and causing empty slides.
     */
    const commitPending = () => {
      const tempParent: Parent = { type: 'root', children: pendingNodes }
      removeDirectiveMarker(tempParent, tempParent.children.length - 1)
      pendingNodes = tempParent.children
      while (pendingNodes.length && isWhitespaceNode(pendingNodes[0]))
        pendingNodes.shift()
      while (
        pendingNodes.length &&
        isWhitespaceNode(pendingNodes[pendingNodes.length - 1])
      )
        pendingNodes.pop()

      if (pendingNodes.length === 0 && Object.keys(pendingAttrs).length === 0)
        return
      const processed = runDirectiveBlock(
        expandIndentedCode(pendingNodes),
        handlersRef.current
      )
      const content = stripLabel(processed)
      const attrsEmpty = Object.keys(pendingAttrs).length === 0
      if (slides.length > 0 && attrsEmpty) {
        const lastSlide = slides[slides.length - 1]
        ;(lastSlide.children as RootContent[]).push(...content)
      } else {
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
        const slideNode: Parent = {
          type: 'paragraph',
          children: content,
          data: {
            hName: 'slide',
            hProperties: buildSlideProps(
              parsed,
              pendingAttrs as Record<string, unknown>
            ) as Properties
          }
        }
        slides.push(slideNode)
      }
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
        const processed = runDirectiveBlock(
          expandIndentedCode(slideDir.children as RootContent[]),
          handlersRef.current
        )
        const content = stripLabel(processed)
        const slideNode: Parent = {
          type: 'paragraph',
          children: content,
          data: {
            hName: 'slide',
            hProperties: buildSlideProps(
              parsed,
              slideDir.attributes as Record<string, unknown>
            ) as Properties
          }
        }
        slides.push(slideNode)
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
      for: handleFor,
      else: handleElse,
      batch: handleBatch,
      option: handleOption,
      select: handleSelect,
      trigger: handleTrigger,
      input: handleInput,
      textarea: handleTextarea,
      onExit: handleOnExit,
      reveal: handleReveal,
      layer: handleLayer,
      text: handleText,
      image: handleImage,
      shape: handleShape,
      preset: handlePreset,
      deck: handleDeck,
      lang: handleLang,
      include: handleInclude,
      title: handleTitle,
      goto: handleGoto,
      preloadImage: handlePreloadImage,
      preloadAudio: handlePreloadAudio,
      sound: handleSound,
      bgm: handleBgm,
      volume: handleVolume,
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
