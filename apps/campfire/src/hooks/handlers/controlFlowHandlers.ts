import { SKIP } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import type { List, Parent, RootContent, Text as MdText } from 'mdast'
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
  isMarkerParagraph,
  isMarkerText,
  ensureParentIndex
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
    setLockedKeys,
    setOnceKeys,
    isTextNode,
    allowedBatchDirectives,
    bannedBatchDirectives
  } = ctx

  /**
   * Extracts an expression from a container directive, using either its label or
   * the first attribute.
   *
   * @param dir - The directive node to evaluate.
   * @returns The extracted expression or an empty string.
   */
  const extractExpressionFromDirective = (dir: ContainerDirective): string => {
    let expr = getLabel(dir) || ''
    if (!expr) {
      const attrs = dir.attributes || {}
      const [firstKey, firstValue] = Object.entries(attrs)[0] || []
      if (firstKey) expr = String(firstValue ?? firstKey)
    }
    return expr
  }

  /**
   * Handles the `switch` container directive, transforming it into a `<switch>` component
   * with corresponding cases and an optional fallback.
   *
   * @param directive - The container directive node representing the switch block.
   * @param parent - The parent node of the directive.
   * @param index - The index of the directive within its parent.
   * @returns Returns void or SKIP to control traversal.
   */
  const handleSwitch: DirectiveHandler = (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    const [p, i] = pair
    const container = directive as ContainerDirective
    const expr = extractExpressionFromDirective(container)
    const children = stripLabel(container.children as RootContent[])

    // Collect sibling case/default directives until the closing marker.
    let cursor = i + 1
    while (cursor < p.children.length) {
      const sibling = p.children[cursor] as RootContent
      if (isMarkerParagraph(sibling) || isMarkerText(sibling)) {
        removeDirectiveMarker(p, cursor)
        break
      }
      if (isWhitespaceRootContent(sibling)) {
        removeNode(p, cursor)
        continue
      }
      if (
        sibling.type === 'containerDirective' &&
        ((sibling as ContainerDirective).name === 'case' ||
          (sibling as ContainerDirective).name === 'default')
      ) {
        children.push(sibling as RootContent)
        removeNode(p, cursor)
        continue
      }
      break
    }

    const cases: { test: string; content: string }[] = []
    let fallbackNodes: RootContent[] | undefined
    for (const child of children) {
      if (child.type !== 'containerDirective') continue
      const dir = child as ContainerDirective
      if (dir.name === 'case') {
        const testExpr = extractExpressionFromDirective(dir)
        const caseChildren = stripLabel(dir.children as RootContent[])
        const processed = runDirectiveBlock(
          expandIndentedCode(caseChildren),
          handlersRef.current
        )
        const content = processed.filter(
          node => !(isTextNode(node) && node.value.trim() === '')
        )
        cases.push({ test: testExpr, content: JSON.stringify(content) })
      } else if (dir.name === 'default') {
        const defChildren = stripLabel(dir.children as RootContent[])
        const processed = runDirectiveBlock(
          expandIndentedCode(defChildren),
          handlersRef.current
        )
        fallbackNodes = processed.filter(
          node => !(isTextNode(node) && node.value.trim() === '')
        )
      }
    }
    const serializedCases = JSON.stringify(cases)
    const fallback = fallbackNodes ? JSON.stringify(fallbackNodes) : undefined
    const node: Parent = {
      type: 'paragraph',
      children: [],
      data: {
        hName: 'switch',
        hProperties: fallback
          ? { test: expr, cases: serializedCases, fallback }
          : { test: expr, cases: serializedCases }
      }
    }
    const newIndex = replaceWithIndentation(directive, p, i, [
      node as RootContent
    ])
    let markerIndex = newIndex + 1
    while (markerIndex < p.children.length) {
      const sibling = p.children[markerIndex] as RootContent
      if (isMarkerParagraph(sibling) || isMarkerText(sibling)) {
        removeDirectiveMarker(p, markerIndex)
        break
      }
      if (isWhitespaceRootContent(sibling)) {
        markerIndex++
        continue
      }
      break
    }
    return [SKIP, newIndex]
  }

  /** Serializes `:::if` blocks into `<if>` components with optional fallback. */
  const handleIf: DirectiveHandler = (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    const [p, i] = pair
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
    const elseSiblingIndex = p.children.findIndex(
      (child, j) =>
        j > i &&
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
      const next = p.children[elseSiblingIndex] as ContainerDirective
      fallbackNodes = next.children as RootContent[]
      const markerIndex = removeNode(p, elseSiblingIndex)
      if (typeof markerIndex === 'number') {
        removeDirectiveMarker(p, markerIndex)
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
    const newIndex = replaceWithIndentation(directive, p, i, [
      node as RootContent
    ])
    // Remove closing directive markers after the if block, skipping whitespace-only nodes
    let markerIndex = newIndex + 1
    while (markerIndex < p.children.length) {
      const sibling = p.children[markerIndex] as RootContent
      if (isMarkerParagraph(sibling) || isMarkerText(sibling)) {
        removeDirectiveMarker(p, markerIndex)
        break
      }
      if (isWhitespaceRootContent(sibling)) {
        markerIndex++
        continue
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
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    const [p, i] = pair
    const container = directive as ContainerDirective
    const label = getLabel(container).trim()
    const match = label.match(/^([A-Za-z_$][\w$]*)\s+in\s+(.+)$/)
    if (!match) {
      const msg = `Malformed for directive: ${label}`
      console.error(msg)
      addError(msg)
      const removed = removeNode(p, i)
      if (typeof removed === 'number') removeDirectiveMarker(p, removed)
      return [SKIP, i]
    }
    const varKey = ensureKey(match[1], p, i)
    if (!varKey) return [SKIP, i]
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

    /**
     * Determines whether a loop iteration produces any renderable output.
     *
     * @param nodes - Nodes generated for the iteration.
     * @returns `true` when at least one node renders content.
     */
    const hasRenderableOutput = (nodes: RootContent[]): boolean => {
      const containsContent = (node: RootContent): boolean => {
        if (isTextNode(node)) {
          if (node.data?.hName) {
            return true
          }
          return node.value.trim().length > 0
        }

        const metadata = (node as { data?: { hName?: string } }).data
        if (metadata?.hName) {
          return true
        }

        if ('children' in node) {
          const parentNode = node as Parent
          const childNodes = (parentNode.children ?? []) as RootContent[]
          return childNodes.some(child => containsContent(child))
        }

        return true
      }

      return nodes.some(node => containsContent(node))
    }
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
            isTextNode(node) &&
            node.data?.hName === 'show' &&
            node.data.hProperties?.['data-key'] === varKey
          ) {
            const props = node.data.hProperties as Record<string, unknown>
            const hasExtra = Object.keys(props).some(key => key !== 'data-key')
            if (hasExtra) {
              props['data-expr'] = JSON.stringify(item)
              delete props['data-key']
              node.value = String(item)
            } else {
              nodes[i] = { type: 'text', value: String(item) }
            }
            continue
          }
          if (
            node.type === 'textDirective' &&
            (node as { name?: string }).name === 'show' &&
            toString(node) === varKey
          ) {
            const attrs =
              (node as { attributes?: Record<string, unknown> }).attributes ||
              {}
            if (Object.keys(attrs).length === 0) {
              nodes[i] = { type: 'text', value: String(item) }
            } else {
              nodes[i] = {
                type: 'text',
                value: String(item),
                data: {
                  hName: 'show',
                  hProperties: {
                    ...attrs,
                    'data-expr': JSON.stringify(item)
                  }
                }
              }
            }
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
      const renderable = hasRenderableOutput(processed)
      if (renderable) {
        output.push(...processed)
      }

      mergeScopedChanges(prevState, scoped, varKey)
    }

    if (output.length > 1) {
      const merged: RootContent[] = []
      output.forEach(node => {
        const last = merged[merged.length - 1]
        if (
          last &&
          last.type === 'list' &&
          node.type === 'list' &&
          (last as List).ordered === (node as List).ordered &&
          (last as List).start === (node as List).start &&
          (last as List).spread === (node as List).spread
        ) {
          const lastList = last as List
          const currentList = node as List
          const lastChildren = (lastList.children ?? []) as List['children']
          const currentChildren = (currentList.children ??
            []) as List['children']
          lastList.children = [...lastChildren, ...currentChildren]
        } else {
          merged.push(node)
        }
      })
      output.splice(0, output.length, ...merged)
    }
    const newIndex = replaceWithIndentation(directive, p, i, output)
    const markerIndex = newIndex + output.length
    removeDirectiveMarker(p, markerIndex)
    const offset = output.length > 0 ? output.length - 1 : 0
    return [SKIP, newIndex + offset]
  }

  /** Inlines the children of `:::else` directives when present. */
  const handleElse: DirectiveHandler = (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    const [p, i] = pair
    const container = directive as ContainerDirective
    const content = stripLabel(container.children as RootContent[])
    const newIndex = replaceWithIndentation(directive, p, i, content)
    const markerIndex = newIndex + content.length
    removeDirectiveMarker(p, markerIndex)
    const offset = content.length > 0 ? content.length - 1 : 0
    return [SKIP, newIndex + offset]
  }

  /**
   * Executes a block of directives against a temporary state and commits
   * the resulting changes in a single update.
   * Only data directives are allowed; nested batch directives are not supported.
   */
  const handleBatch: DirectiveHandler = (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    const [p, i] = pair
    if (
      p.type === 'containerDirective' &&
      (p as ContainerDirective).name === 'batch'
    ) {
      const msg = 'Nested batch directives are not allowed'
      console.error(msg)
      addError(msg)
      removeNode(p, i)
      return [SKIP, i]
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

    removeNode(p, i)
    return [SKIP, i]
  }

  return {
    switch: handleSwitch,
    if: handleIf,
    for: handleFor,
    else: handleElse,
    batch: handleBatch
  }
}
