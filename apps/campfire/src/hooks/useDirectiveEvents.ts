import type { JSX } from 'preact'
import { useRef } from 'preact/hooks'
import type { RootContent } from 'mdast'
import rfdc from 'rfdc'
import { queueTask } from '@campfire/utils/core'
import { runDirectiveBlock } from '@campfire/utils/directiveUtils'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'

const clone = rfdc()

type HandlerState = {
  pending: boolean
  running: boolean
  scheduled: boolean
}

const DEFAULT_HANDLER_STATE: HandlerState = {
  pending: false,
  running: false,
  scheduled: false
}

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

  const enterStateRef = useRef<HandlerState>({ ...DEFAULT_HANDLER_STATE })
  const leaveStateRef = useRef<HandlerState>({ ...DEFAULT_HANDLER_STATE })
  const focusStateRef = useRef<HandlerState>({ ...DEFAULT_HANDLER_STATE })
  const blurStateRef = useRef<HandlerState>({ ...DEFAULT_HANDLER_STATE })

  /**
   * Creates an event handler that executes pre-parsed directive nodes while
   * coalescing duplicate triggers that arrive during the same render burst.
   *
   * @param nodes - Directive nodes to execute.
   * @param stateRef - Mutable state tracking pending and running status.
   * @returns Event handler or undefined when no directives are supplied.
   */
  const createHandler = (
    nodes: RootContent[] | null,
    stateRef: { current: HandlerState }
  ) => {
    if (!nodes) return undefined

    const processQueue = (immediate = false) => {
      const state = stateRef.current
      const shouldRun = state.pending

      if (shouldRun) {
        state.pending = false
        state.running = true
      }

      try {
        if (shouldRun) {
          runDirectiveBlock(clone(nodes), handlers)
        }
      } finally {
        if (shouldRun) {
          state.running = false
        }

        if (state.pending) {
          if (!state.scheduled) {
            state.scheduled = true
            queueTask(processQueue)
          }
        } else if (!immediate) {
          state.scheduled = false
        }
      }
    }

    return () => {
      const state = stateRef.current

      if (state.running) {
        state.pending = true
        return
      }

      if (state.scheduled) return

      state.pending = true
      state.scheduled = true
      queueTask(processQueue)
      processQueue(true)
    }
  }

  return {
    onMouseEnter: createHandler(enterRef.current, enterStateRef),
    onMouseLeave: createHandler(leaveRef.current, leaveStateRef),
    onFocus: createHandler(focusRef.current, focusStateRef),
    onBlur: createHandler(blurRef.current, blurStateRef)
  }
}
