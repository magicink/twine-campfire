import type { JSX } from 'preact'
import { useRef } from 'preact/hooks'
import type { RootContent } from 'mdast'
import rfdc from 'rfdc'
import { runDirectiveBlock } from '@campfire/utils/directiveUtils'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'

const clone = rfdc()

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

  const enterRef = useRef<RootContent[]>()
  const leaveRef = useRef<RootContent[]>()
  const focusRef = useRef<RootContent[]>()
  const blurRef = useRef<RootContent[]>()

  if (onMouseEnter && !enterRef.current)
    enterRef.current = clone(JSON.parse(onMouseEnter)) as RootContent[]
  if (onMouseLeave && !leaveRef.current)
    leaveRef.current = clone(JSON.parse(onMouseLeave)) as RootContent[]
  if (onFocus && !focusRef.current)
    focusRef.current = clone(JSON.parse(onFocus)) as RootContent[]
  if (onBlur && !blurRef.current)
    blurRef.current = clone(JSON.parse(onBlur)) as RootContent[]

  /**
   * Creates an event handler that executes pre-parsed directive nodes.
   *
   * @param nodes - Directive nodes to execute.
   * @returns Event handler or undefined.
   */
  const createHandler = (nodes?: RootContent[]) =>
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
