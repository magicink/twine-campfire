import { SKIP } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import type { Parent, RootContent, Text as MdText } from 'mdast'
import type { ContainerDirective } from 'mdast-util-directive'
import type { DirectiveHandler } from '@campfire/remark-campfire'
import {
  getLabel,
  ensureKey,
  stripLabel,
  removeNode,
  expandIndentedCode,
  replaceWithIndentation,
  runDirectiveBlock,
  filterDirectiveChildren,
  parseTypedValue,
  isRange
} from '@campfire/utils/directiveUtils'
import {
  removeDirectiveMarker,
  isMarkerParagraph
} from '@campfire/utils/directiveHandlerUtils'
import { evalExpression } from '@campfire/utils/core'
import type { StateManagerType } from '@campfire/state/stateManager'
import { isWhitespaceRootContent } from '@campfire/utils/nodePredicates'

/**
 * Context required to create control flow directive handlers.
 */
export interface ControlFlowHandlerContext {
  /** Records an error message. */
  addError: (msg: string) => void
  /** Assigns a value within state. */
  setValue: (path: string, value: unknown) => void
  /** Merges scoped changes back into the parent state. */
  mergeScopedChanges: (
    prev: StateManagerType<Record<string, unknown>>,
    scoped: StateManagerType<Record<string, unknown>>,
    excludeKey?: string
  ) => void
  /** Reference to the current handlers map. */
  handlersRef: { current: Record<string, DirectiveHandler> }
  /** Retrieves the active state manager. */
  getState: () => StateManagerType<Record<string, unknown>>
  /** Replaces the active state manager. */
  setState: (s: StateManagerType<Record<string, unknown>>) => void
  /** Retrieves the current game data snapshot. */
  getGameData: () => Record<string, unknown>
  /** Replaces the current game data snapshot. */
  setGameData: (data: Record<string, unknown>) => void
  /** Retrieves locked state keys. */
  getLockedKeys: () => Record<string, true>
  /** Replaces locked state keys. */
  setLockedKeys: (keys: Record<string, true>) => void
  /** Retrieves once-only state keys. */
  getOnceKeys: () => Record<string, true>
  /** Replaces once-only state keys. */
  setOnceKeys: (keys: Record<string, true>) => void
  /** Determines if a node is a text node. */
  isTextNode: (node: RootContent) => node is MdText
  /** Directives allowed within a batch block. */
  allowedBatchDirectives: Set<string>
  /** Directives disallowed within a batch block. */
  bannedBatchDirectives: Set<string>
}

/**
 * Creates handlers for control flow directives (`if`, `for`, `else`, `batch`).
 *
 * @param ctx - Context providing state access and utilities.
 * @returns An object containing the control flow directive handlers.
 */
export const createControlFlowHandlers = (ctx: ControlFlowHandlerContext) => {
  const {
    addError,
    setValue,
    mergeScopedChanges,
    handlersRef,
    getState,
    setState,
    getGameData,
    setGameData,
    getLockedKeys,
    setLockedKeys,
    getOnceKeys,
    setOnceKeys,
    isTextNode,
    allowedBatchDirectives,
    bannedBatchDirectives
  } = ctx

  /** Serializes `:::if` blocks into `<if>` components with optional fallback. */
  const handleIf: DirectiveHandler = (directive, parent, index) => {
    if (!parent || typeof index !== 'number') return
    const container = directive as ContainerDirective
    const children = container.children as RootContent[]
    let expr = getLabel(container) || ''
    if (!expr) {
      const attrs = container.attributes || {}
      const [firstKey, firstValue] = Object.entries(attrs)[0] || []
      if (firstKey) {
        if (firstValue === '' || firstValue === undefined) {
          expr = firstKey
        } else {
          const valStr = String(firstValue).trim()
          const valueExpr =
            valStr === 'true' ||
            valStr === 'false' ||
            /^-?\d+(?:\.\d+)?$/.test(valStr)
              ? valStr
              : JSON.stringify(valStr)
          expr = `${firstKey} === ${valueExpr}`
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
      const stripped = stripLabel(processed).map(node => {
        if (node.type === 'paragraph' && node.children.length === 1) {
          const child = node.children[0] as any
          if (
            child.type === 'containerDirective' &&
            (child as ContainerDirective).name === 'if'
          ) {
            return child
          }
        }
        return node
      })
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
    // Remove closing directive markers after the if block, skipping whitespace-only nodes
    let markerIndex = newIndex + 1
    while (markerIndex < parent.children.length) {
      const sibling = parent.children[markerIndex]
      if (isWhitespaceRootContent(sibling)) {
        markerIndex++
        continue
      }
      if (isMarkerParagraph(sibling)) {
        removeDirectiveMarker(parent, markerIndex)
      }
      break
    }
    return [SKIP, newIndex]
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
      iterableValue = evalExpression(expr, getGameData())
      if (iterableValue === undefined) {
        iterableValue = parseTypedValue(expr, getGameData())
      }
    } catch (error) {
      console.warn(
        `Failed to evaluate expression in for directive: ${expr}`,
        error
      )
      iterableValue = parseTypedValue(expr, getGameData())
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
      const scoped = getState().createScope()
      const prevState = getState()
      setState(scoped)
      setGameData(scoped.getState())
      setLockedKeys(scoped.getLockedKeys())
      setOnceKeys(scoped.getOnceKeys())

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
              passes = Boolean(evalExpression(testExpr, getGameData()))
            } catch {
              try {
                passes = Boolean(parseTypedValue(testExpr, getGameData()))
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

  /** Inlines the children of `:::else` directives when present. */
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
    const allowed = allowedBatchDirectives
    const expanded = expandIndentedCode(container.children as RootContent[])
    const processedForFilter = runDirectiveBlock(expanded)
    const stripped = stripLabel(processedForFilter)
    const [filtered, invalid, nested] = filterDirectiveChildren(
      stripped,
      allowed,
      bannedBatchDirectives
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

    const scoped = getState().createScope()
    const prevState = getState()
    setState(scoped)
    setGameData(scoped.getState())
    setLockedKeys(scoped.getLockedKeys())
    setOnceKeys(scoped.getOnceKeys())

    runDirectiveBlock(expandIndentedCode(filtered), handlersRef.current)

    const changes = scoped.getChanges()
    setState(prevState)
    getState().applyChanges(changes)
    setGameData(getState().getState())
    setLockedKeys(getState().getLockedKeys())
    setOnceKeys(getState().getOnceKeys())

    removeNode(parent, index)
    return [SKIP, index]
  }

  return { if: handleIf, for: handleFor, else: handleElse, batch: handleBatch }
}
