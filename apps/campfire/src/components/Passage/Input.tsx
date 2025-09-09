import { mergeClasses } from '@campfire/utils/core'
import {
  fieldBaseStyles,
  useBoundField,
  type BoundFieldElementProps
} from './BoundFieldProps'

const inputStyles = mergeClasses(
  fieldBaseStyles,
  'file:text-foreground selection:bg-primary selection:text-primary-foreground disabled:pointer-events-none min-w-0 h-9 px-3 py-1 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium'
)

type InputProps = BoundFieldElementProps<HTMLInputElement, string>

/**
 * Text input bound to a game state key. Updates the key on user input.
 *
 * @param stateKey - Key in game state to store the value.
 * @param className - Optional additional classes.
 * @param onMouseEnter - Serialized directives to run on mouse enter.
 * @param onMouseLeave - Serialized directives to run on mouse leave.
 * @param onFocus - Serialized directives to run on focus.
 * @param onBlur - Serialized directives to run on blur.
 * @param rest - Additional input element attributes.
 * @returns The rendered input element.
 */
export const Input = ({
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
}: InputProps) => {
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
    <input
      data-testid='input'
      className={mergeClasses('campfire-input', inputStyles, className)}
      value={value ?? ''}
      disabled={isDisabled}
      {...rest}
      {...directiveEvents}
      onInput={e => {
        onInput?.(e)
        if (e.defaultPrevented) return
        const target = e.currentTarget as HTMLInputElement
        setValue(target.value)
      }}
    />
  )
}

export default Input
