import { mergeClasses } from '@campfire/utils/core'
import {
  fieldBaseStyles,
  useBoundField,
  type BoundFieldElementProps
} from './BoundFieldProps'

const textareaStyles = mergeClasses(
  fieldBaseStyles,
  'field-sizing-content min-h-16 px-3 py-2'
)

type TextareaProps = BoundFieldElementProps<HTMLTextAreaElement, string>

/**
 * Textarea bound to a game state key. Updates the key on user input.
 *
 * @param stateKey - Key in game state to store the value.
 * @param className - Optional additional classes.
 * @param onMouseEnter - Serialized directives to run on mouse enter.
 * @param onMouseLeave - Serialized directives to run on mouse leave.
 * @param onFocus - Serialized directives to run on focus.
 * @param onBlur - Serialized directives to run on blur.
 * @param rest - Additional textarea element attributes.
 * @returns The rendered textarea element.
 */
export const Textarea = ({
  stateKey,
  className,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onInput,
  initialValue,
  disabled,
  ...rest
}: TextareaProps) => {
  const { value, setValue, isDisabled, directiveEvents } =
    useBoundField<string>({
      stateKey,
      initialValue: initialValue ?? '',
      disabled,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur
    })
  return (
    <textarea
      data-testid='textarea'
      className={mergeClasses('campfire-textarea', textareaStyles, className)}
      value={value ?? ''}
      disabled={isDisabled}
      {...rest}
      {...directiveEvents}
      onInput={e => {
        onInput?.(e)
        if (e.defaultPrevented) return
        const target = e.currentTarget as HTMLTextAreaElement
        setValue(target.value)
      }}
    />
  )
}

export default Textarea
