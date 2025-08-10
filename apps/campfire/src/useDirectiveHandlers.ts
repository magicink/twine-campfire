import { useEffect, useMemo, useRef } from 'preact/hooks'
import i18next from 'i18next'
import { SKIP } from 'unist-util-visit'
import { compile } from 'expression-eval'
import { toString } from 'mdast-util-to-string'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import remarkCampfire, {
  remarkCampfireIndentation
} from '@/packages/remark-campfire'
import type { Text as MdText, Parent, RootContent, Root } from 'mdast'
import type { Node } from 'unist'
import type { Text as HastText, ElementContent, Properties } from 'hast'
import type { ContainerDirective } from 'mdast-util-directive'
import { useStoryDataStore } from '@/packages/use-story-data-store'
import { useGameStore, type Checkpoint } from '@/packages/use-game-store'
import { markTitleOverridden } from './titleState'
import {
  parseNumericValue,
  getRandomItem,
  getRandomInt,
  ensureKey,
  removeNode,
  type DirectiveNode,
  getLabel,
  stripLabel,
  extractAttributes
} from './directives/helpers'
import { getTranslationOptions } from './i18n'
import type {
  DirectiveHandler,
  DirectiveHandlerResult
} from '@/packages/remark-campfire'
import { createStateManager } from './stateManager'
const QUOTE_PATTERN = /^(['"`])(.*)\1$/
const NUMERIC_PATTERN = /^\d+$/
const ALLOWED_ONEXIT_DIRECTIVES = new Set([
  'set',
  'setOnce',
  'array',
  'arrayOnce',
  'unset',
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
  const restoreCheckpointFn = useGameStore(state => state.restoreCheckpoint)
  const setLoading = useGameStore(state => state.setLoading)
  const addError = useGameStore(state => state.addError)
  const clearErrors = useGameStore(state => state.clearErrors)
  const currentPassageId = useStoryDataStore(state => state.currentPassageId)
  const setCurrentPassage = useStoryDataStore(state => state.setCurrentPassage)
  const getPassageById = useStoryDataStore(state => state.getPassageById)
  const getPassageByName = useStoryDataStore(state => state.getPassageByName)
  const handlersRef = useRef<Record<string, DirectiveHandler>>({})
  const storeCheckpoints = useGameStore(state => state.checkpoints)
  const checkpointIdRef = useRef<string | null>(null)
  const checkpointErrorRef = useRef(false)
  const onExitSeenRef = useRef(false)
  const onExitErrorRef = useRef(false)
  const lastPassageIdRef = useRef<string | undefined>(undefined)

  const MAX_INCLUDE_DEPTH = 10
  let includeDepth = 0

  /**
   * Replaces a directive with new nodes while restoring preserved indentation.
   *
   * @param directive - Directive being replaced.
   * @param parent - Parent of the directive.
   * @param index - Index of the directive in its parent.
   * @param nodes - Nodes to insert.
   * @returns The index of the first inserted node.
   */
  const replaceWithIndentation = (
    directive: DirectiveNode,
    parent: Parent,
    index: number,
    nodes: RootContent[]
  ): number => {
    const indent = (directive.data as { indentation?: string } | undefined)
      ?.indentation
    const insert: RootContent[] = indent
      ? ([{ type: 'text', value: indent } as MdText, ...nodes] as RootContent[])
      : nodes
    parent.children.splice(index, 1, ...insert)
    return index + (indent ? 1 : 0)
  }

  /**
   * Processes a block of AST nodes using the unified processor with the remarkCampfire plugin.
   *
   * @param nodes - An array of RootContent nodes to process.
   */
  const runBlock = (nodes: RootContent[]) => {
    const root: Root = { type: 'root', children: nodes }
    unified()
      .use(remarkCampfireIndentation)
      .use(remarkCampfire, { handlers: handlersRef.current })
      .runSync(root)
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
     * Parses a value supplied via the shorthand `:set[key=value]` syntax. Values
     * are interpreted as strings when wrapped in quotes or backticks, booleans
     * for literal `true`/`false`, objects when enclosed in curly braces, numbers
     * when they contain only digits, and expressions evaluated against the
     * current game state otherwise.
     *
     * @param raw - Raw value string from the directive.
     * @returns The parsed value or `undefined` on failure.
     */
    const parseShorthandValue = (raw: string): unknown => {
      const trimmed = raw.trim()
      const quoted = trimmed.match(QUOTE_PATTERN)
      if (quoted) return quoted[2]
      if (trimmed === 'true') return true
      if (trimmed === 'false') return false
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const inner = trimmed.slice(1, -1)
        const obj: Record<string, unknown> = {}
        for (const part of inner.split(',')) {
          const colonIndex = part.indexOf(':')
          if (colonIndex === -1) continue
          const key = part.slice(0, colonIndex).trim()
          if (!key) continue
          const value = part.slice(colonIndex + 1)
          const parsed = parseShorthandValue(value)
          if (typeof parsed !== 'undefined') obj[key] = parsed
        }
        return obj
      }
      const num = Number(trimmed)
      if (!Number.isNaN(num)) return num
      try {
        const fn = compile(trimmed)
        return fn(gameData)
      } catch {
        return (gameData as Record<string, unknown>)[trimmed]
      }
    }

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
      const parsed = parseShorthandValue(valueRaw)
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
      input.match(/[^\s]+=\s*[^]+?(?=(?:\s+[^\s]+=)|$)/g) || []

    if (shorthand) {
      for (const part of extractPairs(shorthand)) {
        applyShorthand(part)
      }
    }

    if (Object.keys(safe).length > 0) {
      for (const [k, v] of Object.entries(safe)) {
        state.setValue(k, v, { lock })
      }
      gameData = state.getState()
      lockedKeys = state.getLockedKeys()
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
    const label = (
      hasLabel(directive) ? directive.label : toString(directive)
    ).trim()
    const eq = label.indexOf('=')
    if (eq === -1) {
      const msg = `Malformed array directive: ${label}`
      console.error(msg)
      addError(msg)
      return index
    }

    const keyRaw = label.slice(0, eq).trim()
    const key = ensureKey(keyRaw, parent, index)
    if (!key) return index

    const valueRaw = label.slice(eq + 1).trim()
    if (!valueRaw.startsWith('[') || !valueRaw.endsWith(']')) {
      const msg = `Array directive value must be in [ ] notation: ${label}`
      console.error(msg)
      addError(msg)
      return index
    }

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

    const parseItem = (value: string): unknown => {
      const trimmed = value.trim()
      if (!trimmed) return undefined
      const quoted = trimmed.match(QUOTE_PATTERN)
      if (quoted) return quoted[2]
      if (trimmed === 'true') return true
      if (trimmed === 'false') return false
      const num = Number(trimmed)
      if (!Number.isNaN(num)) return num
      try {
        const fn = compile(trimmed)
        return fn(gameData)
      } catch {
        return trimmed
      }
    }

    let items: unknown[] = []
    try {
      const parsed = JSON.parse(valueRaw)
      if (Array.isArray(parsed)) {
        items = parsed
      } else {
        throw new Error('not an array')
      }
    } catch {
      const inner = valueRaw.slice(1, -1)
      items = splitItems(inner).map(parseItem)
    }

    state.setValue(key, items, { lock })
    gameData = state.getState()
    lockedKeys = state.getLockedKeys()

    return removeNode(parent, index)
  }

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
   *
   * @param directive - The `random` directive node being processed.
   * @param parent - The parent AST node containing this directive.
   * @param index - The index of the directive within its parent.
   */
  const handleRandom: DirectiveHandler = (directive, parent, index) => {
    const label = hasLabel(directive) ? directive.label : toString(directive)
    const key = ensureKey(label.trim(), parent, index)
    if (!key) return index

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
    if (optionList && optionList.length) {
      value = getRandomItem(optionList)
    } else {
      const { min, max } = attrs
      if (typeof min === 'number' && typeof max === 'number') {
        value = getRandomInt(min, max)
      }
    }

    if (value !== undefined) {
      setValue(key, value)
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
        try {
          const fn = compile(item)
          const evaluated = fn(gameData)
          if (evaluated === undefined) return [item]
          return Array.isArray(evaluated) ? evaluated : [evaluated]
        } catch {
          return [item]
        }
      })

  /**
   * Retrieves a value from the current game state using dot notation.
   *
   * @param path - Dot separated path of the desired value.
   * @returns The value at the provided path or undefined.
   */
  const getValue = (path: string): unknown => state.getValue(path)

  /**
   * Sets a value within the game state using dot notation.
   *
   * @param path - Dot separated path where the value should be stored.
   * @param value - The value to assign at the provided path.
   */
  const setValue = (path: string, value: unknown) => {
    state.setValue(path, value)
    gameData = state.getState()
    lockedKeys = state.getLockedKeys()
    onceKeys = state.getOnceKeys()
  }

  /**
   * Removes a value from the game state using dot notation.
   *
   * @param path - Dot separated path of the value to remove.
   */
  const unsetValue = (path: string) => {
    state.unsetValue(path)
    gameData = state.getState()
    lockedKeys = state.getLockedKeys()
    onceKeys = state.getOnceKeys()
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
          const parseNum = (value: unknown, defaultValue = 0): number => {
            if (typeof value === 'number') return value
            if (typeof value === 'string') {
              let evaluated: unknown = value
              try {
                const fn = compile(value)
                evaluated = fn(gameData)
              } catch {
                // ignore
              }
              return parseNumericValue(evaluated, defaultValue)
            }
            return defaultValue
          }

          const start = parseNum((attrs as Record<string, unknown>).index, 0)
          const count = parseNum((attrs as Record<string, unknown>).count, 0)
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
   * Removes a paragraph containing only the directive marker from the parent.
   *
   * @param parent - The parent node that may contain the marker.
   * @param index - The index of the potential marker node.
   */
  const removeDirectiveMarker = (parent: Parent, index: number) => {
    const marker = parent.children[index]
    if (
      marker &&
      marker.type === 'paragraph' &&
      marker.children.length === 1 &&
      isTextNode(marker.children[0]) &&
      marker.children[0].value.trim() === DIRECTIVE_MARKER
    ) {
      parent.children.splice(index, 1)
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
    let fallback: string | undefined
    let main = children
    if (elseIndex !== -1) {
      const next = children[elseIndex] as ContainerDirective
      main = children.slice(0, elseIndex)
      fallback = JSON.stringify(stripLabel(next.children as RootContent[]))
    } else if (elseSiblingIndex !== -1) {
      const next = parent.children[elseSiblingIndex] as ContainerDirective
      fallback = JSON.stringify(stripLabel(next.children as RootContent[]))
      const markerIndex = removeNode(parent, elseSiblingIndex)
      if (typeof markerIndex === 'number') {
        removeDirectiveMarker(parent, markerIndex)
      }
    }
    const content = JSON.stringify(stripLabel(main))
    const node: Parent = {
      type: 'paragraph',
      children: [{ type: 'text', value: '' }],
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
    const [filtered, invalid, nested] = filterDirectiveChildren(
      rawChildren,
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
    if (parent && typeof index === 'number') {
      const prev = parent.children[index - 1] as MdText | undefined
      const next = parent.children[index + 1] as MdText | undefined
      const inLink =
        prev?.type === 'text' &&
        prev.value.endsWith('[[') &&
        next?.type === 'text' &&
        next.value.includes(']]')
      const options = getTranslationOptions({ ns, count: attrs.count })
      if (inLink) {
        const text = i18next.t(key, options)
        if (prev && next) {
          prev.value += text + next.value
          parent.children.splice(index, 2)
          return index - 1
        }
        const newIndex = replaceWithIndentation(directive, parent, index, [
          { type: 'text', value: text }
        ])
        return newIndex
      }
      const props: Properties = { 'data-i18n-key': key }
      if (ns) props['data-i18n-ns'] = ns
      if (options.count !== undefined) props['data-i18n-count'] = options.count
      const node: MdText = {
        type: 'text',
        value: '0', // non-empty placeholder required for mdast conversion
        data: { hName: 'show', hProperties: props }
      }
      const newIndex = replaceWithIndentation(directive, parent, index, [node])
      return newIndex
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

  const handleRestore: DirectiveHandler = (directive, parent, index) => {
    if (includeDepth > 0) return removeNode(parent, index)
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const id = typeof attrs.id === 'string' ? attrs.id : undefined
    const cp = restoreCheckpointFn(id)
    if (cp?.currentPassageId) {
      setCurrentPassage(cp.currentPassageId)
    }
    return removeNode(parent, index)
  }

  const handleClearCheckpoint: DirectiveHandler = (
    directive,
    parent,
    index
  ) => {
    if (includeDepth > 0) return removeNode(parent, index)
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const id = typeof attrs.id === 'string' ? attrs.id : undefined
    if (id) {
      removeCheckpoint(id)
    } else {
      useGameStore.setState({ checkpoints: {} })
    }
    return removeNode(parent, index)
  }

  /**
   * Handles the `:clearErrors` directive, which removes all logged game errors.
   * Calls the clearErrors function to reset the error state.
   *
   * @param _directive - The directive node representing the clearErrors directive (unused).
   * @param parent - The parent AST node containing this directive.
   * @param index - The index of the directive node within its parent.
   * @returns The new index after removal.
   */
  const handleClearErrors: DirectiveHandler = (_directive, parent, index) => {
    clearErrors()
    return removeNode(parent, index)
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
      show: handleShow,
      random: handleRandom,
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
      lang: handleLang,
      include: handleInclude,
      title: handleTitle,
      goto: handleGoto,
      save: handleSave,
      load: handleLoad,
      clearSave: handleClearSave,
      checkpoint: handleCheckpoint,
      clearCheckpoint: handleClearCheckpoint,
      restore: handleRestore,
      clearErrors: handleClearErrors,
      translations: handleTranslations,
      t: handleTranslate
    }
    handlersRef.current = handlers
    return handlers
  }, [])
}
