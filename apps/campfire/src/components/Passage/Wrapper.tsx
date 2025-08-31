import type { JSX } from 'preact'
import { useDirectiveEvents } from '@campfire/hooks/useDirectiveEvents'
import { mergeClasses } from '@campfire/utils/core'

interface WrapperProps
  extends Omit<
    JSX.HTMLAttributes<HTMLElement>,
    | 'className'
    | 'onMouseEnter'
    | 'onMouseLeave'
    | 'onMouseDown'
    | 'onMouseUp'
    | 'onFocus'
    | 'onBlur'
  > {
  /** HTML tag to render for the wrapper. */
  as: 'div' | 'span' | 'p' | 'section'
  /** Additional CSS classes for the wrapper element. */
  className?: string
  /** Serialized directives to run on mouse enter. */
  onMouseEnter?: string
  /** Serialized directives to run on mouse exit. */
  onMouseExit?: string
  /** Serialized directives to run on mouse down. */
  onMouseDown?: string
  /** Serialized directives to run on mouse up. */
  onMouseUp?: string
  /** Serialized directives to run on focus. */
  onFocus?: string
  /** Serialized directives to run on blur. */
  onBlur?: string
}

/**
 * Basic HTML wrapper that supports directive event handlers.
 *
 * @param as - HTML tag to render for the wrapper.
 * @param className - Optional additional classes.
 * @param onMouseEnter - Serialized directives to run on mouse enter.
 * @param onMouseExit - Serialized directives to run on mouse exit.
 * @param onMouseDown - Serialized directives to run on mouse down.
 * @param onMouseUp - Serialized directives to run on mouse up.
 * @param onFocus - Serialized directives to run on focus.
 * @param onBlur - Serialized directives to run on blur.
 * @param rest - Additional element attributes.
 * @returns The rendered wrapper element.
 */
export const Wrapper = ({
  as: Tag,
  className,
  onMouseEnter,
  onMouseExit,
  onMouseDown,
  onMouseUp,
  onFocus,
  onBlur,
  children,
  ...rest
}: WrapperProps) => {
  const directiveEvents = useDirectiveEvents(
    onMouseEnter,
    onMouseExit,
    onMouseDown,
    onMouseUp,
    onFocus,
    onBlur
  )
  return (
    <Tag
      data-testid='wrapper'
      className={mergeClasses('campfire-wrapper', className)}
      {...(rest as any)}
      {...directiveEvents}
    >
      {children}
    </Tag>
  )
}

export default Wrapper
