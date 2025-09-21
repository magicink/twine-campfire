import { SKIP } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import remarkCampfire, {
  remarkCampfireIndentation
} from '@campfire/remark-campfire'
import type { RootContent } from 'mdast'
import type { ElementContent, Text as HastText } from 'hast'
import i18next from 'i18next'
import { QUOTE_PATTERN } from '@campfire/utils/core'
import {
  removeNode,
  replaceWithIndentation
} from '@campfire/utils/directiveUtils'
import {
  ensureParentIndex,
  requireLeafDirective
} from '@campfire/utils/directiveHandlerUtils'
import type { DirectiveHandler } from '@campfire/remark-campfire'
import { markTitleOverridden } from '@campfire/state/titleState'

/** Regular expression matching numeric strings. */
const NUMERIC_PATTERN = /^\d+$/

/** Maximum allowed depth for nested includes. */
const MAX_INCLUDE_DEPTH = 10

/**
 * Context required to create navigation directive handlers.
 */
export interface NavigationHandlerContext {
  /** Records an error message. */
  addError: (msg: string) => void
  /** Sets the current passage identifier. */
  setCurrentPassage: (id: string) => void
  /** Retrieves a passage by id. */
  getPassageById: (id: string) => { children: ElementContent[] } | undefined
  /** Retrieves a passage by name. */
  getPassageByName: (name: string) => { children: ElementContent[] } | undefined
  /** Retrieves the latest game data snapshot. */
  getGameData: () => Record<string, unknown>
  /** Reference to the current handlers map. */
  handlersRef: { current: Record<string, DirectiveHandler> }
  /** Retrieves the current include depth. */
  getIncludeDepth: () => number
  /** Increments the include depth. */
  incrementIncludeDepth: () => void
  /** Decrements the include depth. */
  decrementIncludeDepth: () => void
  /** Toggles whether landscape orientation is allowed. */
  toggleAllowLandscape: () => void
}

/**
 * Creates handlers for navigation directives (`::goto`, `::title`, `::include`).
 *
 * @param ctx - Context providing state access and utilities.
 * @returns An object containing the navigation directive handlers.
 */
export const createNavigationHandlers = (ctx: NavigationHandlerContext) => {
  const {
    addError,
    setCurrentPassage,
    getPassageById,
    getPassageByName,
    getGameData,
    handlersRef,
    getIncludeDepth,
    incrementIncludeDepth,
    decrementIncludeDepth,
    toggleAllowLandscape
  } = ctx

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
   * @param data - The game state snapshot to inspect.
   * @returns The value as a string if present, otherwise undefined.
   */
  const getStateValue = (
    key: string,
    data: Record<string, unknown>
  ): string | undefined => {
    if (!Object.hasOwn(data, key)) return undefined
    const value = data[key]
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
    if (!attr) return undefined
    const quoted = getQuotedValue(attr)
    if (quoted) return quoted
    if (NUMERIC_PATTERN.test(attr)) return attr
    return getStateValue(attr, getGameData())
  }

  /**
   * Handles the `::goto` directive, which navigates to another passage.
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
    const invalid = requireLeafDirective(directive, parent, index, addError)
    if (invalid !== undefined) return invalid
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
   * Handles the `::title` directive, which overrides the page title for the current passage.
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
    const invalid = requireLeafDirective(directive, parent, index, addError)
    if (invalid !== undefined) return invalid
    if (getIncludeDepth() > 0) return removeNode(parent, index)
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
    const invalid = requireLeafDirective(directive, parent, index, addError)
    if (invalid !== undefined) return invalid
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const rawText = toString(directive).trim()
    const target = resolvePassageTarget(rawText, attrs)

    const pair = ensureParentIndex(parent, index)
    if (!pair || !target) {
      return removeNode(parent, index)
    }
    const [p, i] = pair

    if (getIncludeDepth() >= MAX_INCLUDE_DEPTH) {
      console.warn('Max include depth reached')
      return removeNode(parent, index)
    }

    const passage = NUMERIC_PATTERN.test(target)
      ? getPassageById(target)
      : getPassageByName(target)

    if (!passage) return removeNode(p, i)

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

    incrementIncludeDepth()
    const tree = processor.parse(text)
    processor.runSync(tree)
    decrementIncludeDepth()

    const newIndex = replaceWithIndentation(
      directive,
      p,
      i,
      tree.children as RootContent[]
    )
    return [
      SKIP,
      newIndex + Math.max(0, (tree.children as RootContent[]).length - 1)
    ]
  }

  /**
   * Handles the `::allowLandscape` directive, toggling whether landscape orientation is permitted.
   *
   * @param directive - The directive node representing the allowLandscape directive.
   * @param parent - The parent AST node containing this directive.
   * @param index - The index of the directive node within its parent.
   * @returns The new index after replacement.
   */
  const handleAllowLandscape: DirectiveHandler = (directive, parent, index) => {
    const invalid = requireLeafDirective(directive, parent, index, addError)
    if (invalid !== undefined) return invalid
    toggleAllowLandscape()
    return removeNode(parent, index)
  }

  return {
    goto: handleGoto,
    title: handleTitle,
    include: handleInclude,
    allowLandscape: handleAllowLandscape
  }
}
