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
 * @returns Object containing `onMouseEnter`, `onMouseLeave`, `onFocus`, and `onBlur` handlers.
 */
export const useDirectiveEvents = (
  onMouseEnter?: string,
  onMouseLeave?: string,
  onFocus?: string,
  onBlur?: string
): Pick<
  JSX.HTMLAttributes<HTMLElement>,
  'onMouseEnter' | 'onMouseLeave' | 'onFocus' | 'onBlur'
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
    onMouseEnter: createHandler(onMouseEnter),
    onMouseLeave: createHandler(onMouseLeave),
    onFocus: createHandler(onFocus),
    onBlur: createHandler(onBlur)
  }
}
