import type { JSX } from 'preact'
import type { RootContent } from 'mdast'
import rfdc from 'rfdc'
import { runDirectiveBlock } from '@campfire/utils/directiveUtils'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'

const clone = rfdc()

/**
 * Generates directive event handlers from serialized directive strings.
 *
 * @param onHover - Serialized directives to run when hovered.
 * @param onFocus - Serialized directives to run on focus.
 * @param onBlur - Serialized directives to run on blur.
 * @returns Object containing `onMouseEnter`, `onFocus`, and `onBlur` handlers.
 */
export const useDirectiveEvents = (
  onHover?: string,
  onFocus?: string,
  onBlur?: string
): Pick<
  JSX.HTMLAttributes<HTMLElement>,
  'onMouseEnter' | 'onFocus' | 'onBlur'
> => {
  const handlers = useDirectiveHandlers()

  const createHandler = (content?: string) =>
    content
      ? () =>
          runDirectiveBlock(
            clone(JSON.parse(content)) as RootContent[],
            handlers
          )
      : undefined

  return {
    onMouseEnter: createHandler(onHover),
    onFocus: createHandler(onFocus),
    onBlur: createHandler(onBlur)
  }
}
