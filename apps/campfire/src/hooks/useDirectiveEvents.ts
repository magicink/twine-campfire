import type { JSX } from 'preact'
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
 * @param onChange - Serialized directives to run on change.
 * @returns Object containing event handlers.
 */
export const useDirectiveEvents = (
  onMouseEnter?: string,
  onMouseLeave?: string,
  onFocus?: string,
  onBlur?: string,
  onChange?: string
): {
  onMouseEnter?: JSX.HTMLAttributes<HTMLElement>['onMouseEnter']
  onMouseLeave?: JSX.HTMLAttributes<HTMLElement>['onMouseLeave']
  onFocus?: JSX.HTMLAttributes<HTMLElement>['onFocus']
  onBlur?: JSX.HTMLAttributes<HTMLElement>['onBlur']
  onChange?: () => void
} => {
  const handlers = useDirectiveHandlers()

  const createHandler = (content?: string) =>
    content
      ? () =>
          runDirectiveBlock(
            clone(JSON.parse(content)) as RootContent[],
            handlers
          )
      : undefined

  // TODO(campfire): Consider debouncing mouse events and preventing re-entry
  // while a directive block is running; add tests for both handler present
  // and undefined paths per repository guidelines.
  return {
    onMouseEnter: createHandler(onMouseEnter),
    onMouseLeave: createHandler(onMouseLeave),
    onFocus: createHandler(onFocus),
    onBlur: createHandler(onBlur),
    onChange: createHandler(onChange)
  }
}
