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
 * @param onMouseExit - Serialized directives to run on mouse exit.
 * @param onMouseDown - Serialized directives to run on mouse down.
 * @param onMouseUp - Serialized directives to run on mouse up.
 * @param onFocus - Serialized directives to run on focus.
 * @param onBlur - Serialized directives to run on blur.
 * @returns Object containing event handlers.
 */
export const useDirectiveEvents = (
  onMouseEnter?: string,
  onMouseExit?: string,
  onMouseDown?: string,
  onMouseUp?: string,
  onFocus?: string,
  onBlur?: string
): Pick<
  JSX.HTMLAttributes<HTMLElement>,
  | 'onMouseEnter'
  | 'onMouseLeave'
  | 'onMouseDown'
  | 'onMouseUp'
  | 'onFocus'
  | 'onBlur'
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
    onMouseLeave: createHandler(onMouseExit),
    onMouseDown: createHandler(onMouseDown),
    onMouseUp: createHandler(onMouseUp),
    onFocus: createHandler(onFocus),
    onBlur: createHandler(onBlur)
  }
}
