import type { JSX } from 'preact'
import { useRef } from 'preact/hooks'
import type { RootContent } from 'mdast'
import rfdc from 'rfdc'
import { runDirectiveBlock } from '@campfire/utils/directiveUtils'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'

const clone = rfdc()

/**
 * Parses a serialized directive string into directive nodes.
 *
 * @param source - Serialized directive string to parse.
 * @returns Cloned directive nodes or null if parsing fails.
 */
const parseDirective = (source?: string): RootContent[] | null => {
  if (!source) return null
  try {
    return clone(JSON.parse(source)) as RootContent[]
  } catch (error) {
    console.error('Failed to parse directive JSON', error)
    return null
  }
}

/**
 * Generates directive event handlers from serialized directive strings.
 *
 * @param onMouseEnter - Serialized directives to run on mouse enter.
 * @param onMouseLeave - Serialized directives to run on mouse leave.
 * @param onFocus - Serialized directives to run on focus.
 * @param onBlur - Serialized directives to run on blur.
 * @returns Object containing event handlers.
 */
export const useDirectiveEvents = (
  onMouseEnter?: string,
  onMouseLeave?: string,
  onFocus?: string,
  onBlur?: string
): {
  onMouseEnter?: JSX.HTMLAttributes<HTMLElement>['onMouseEnter']
  onMouseLeave?: JSX.HTMLAttributes<HTMLElement>['onMouseLeave']
  onFocus?: JSX.HTMLAttributes<HTMLElement>['onFocus']
  onBlur?: JSX.HTMLAttributes<HTMLElement>['onBlur']
} => {
  const handlers = useDirectiveHandlers()

  const enterRef = useRef<RootContent[] | null>(null)
  const leaveRef = useRef<RootContent[] | null>(null)
  const focusRef = useRef<RootContent[] | null>(null)
  const blurRef = useRef<RootContent[] | null>(null)

  if (enterRef.current === null && onMouseEnter)
    enterRef.current = parseDirective(onMouseEnter)
  if (leaveRef.current === null && onMouseLeave)
    leaveRef.current = parseDirective(onMouseLeave)
  if (focusRef.current === null && onFocus)
    focusRef.current = parseDirective(onFocus)
  if (blurRef.current === null && onBlur)
    blurRef.current = parseDirective(onBlur)

  /**
   * Creates an event handler that executes pre-parsed directive nodes.
   *
   * @param nodes - Directive nodes to execute.
   * @returns Event handler or undefined.
   */
  const createHandler = (nodes: RootContent[] | null) =>
    nodes ? () => runDirectiveBlock(clone(nodes), handlers) : undefined

  // TODO(campfire): Consider debouncing mouse events and preventing re-entry
  // while a directive block is running; add tests for both handler present
  // and undefined paths per repository guidelines.
  return {
    onMouseEnter: createHandler(enterRef.current),
    onMouseLeave: createHandler(leaveRef.current),
    onFocus: createHandler(focusRef.current),
    onBlur: createHandler(blurRef.current)
  }
}
