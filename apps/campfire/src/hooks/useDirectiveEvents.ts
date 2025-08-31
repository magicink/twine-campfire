import type { JSX } from 'preact'
import { useSerializedDirectiveRunner } from '@campfire/hooks/useSerializedDirectiveRunner'

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
  const runMouseEnter = onMouseEnter
    ? useSerializedDirectiveRunner(onMouseEnter)
    : undefined
  const runMouseExit = onMouseExit
    ? useSerializedDirectiveRunner(onMouseExit)
    : undefined
  const runMouseDown = onMouseDown
    ? useSerializedDirectiveRunner(onMouseDown)
    : undefined
  const runMouseUp = onMouseUp
    ? useSerializedDirectiveRunner(onMouseUp)
    : undefined
  const runFocus = onFocus ? useSerializedDirectiveRunner(onFocus) : undefined
  const runBlur = onBlur ? useSerializedDirectiveRunner(onBlur) : undefined

  return {
    onMouseEnter: runMouseEnter,
    onMouseLeave: runMouseExit,
    onMouseDown: runMouseDown,
    onMouseUp: runMouseUp,
    onFocus: runFocus,
    onBlur: runBlur
  }
}
