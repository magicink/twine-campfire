import { mergeClasses } from '@campfire/utils/core'
import { radioStyles, radioIndicatorStyles } from '@campfire/utils/remarkStyles'
import { useBoundField, type BoundFieldElementProps } from './BoundFieldProps'

type RadioProps = BoundFieldElementProps<HTMLButtonElement, string> & {
  /** Value represented by this radio button. */
  value: string
}

/**
 * Radio button bound to a game state key. Updates the key to its value on click.
 *
 * @param stateKey - Key in game state to store the selected value.
 * @param value - Value represented by this radio button.
 * @param className - Optional additional classes.
 * @param onMouseEnter - Serialized directives to run on mouse enter.
 * @param onMouseLeave - Serialized directives to run on mouse leave.
 * @param onFocus - Serialized directives to run on focus.
 * @param onBlur - Serialized directives to run on blur.
 * @param rest - Additional button element attributes.
 * @returns The rendered radio element.
 */
export const Radio = ({
  stateKey,
  value: optionValue,
  className,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onClick,
  initialValue,
  disabled,
  ...rest
}: RadioProps) => {
  const { value, setValue, isDisabled, directiveEvents } =
    useBoundField<string>({
      stateKey,
      initialValue,
      disabled,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur
    })
  const checked = value === optionValue
  return (
    <button
      type='button'
      role='radio'
      data-testid='radio'
      className={mergeClasses('campfire-radio', radioStyles, className)}
      aria-checked={checked}
      data-state={checked ? 'checked' : 'unchecked'}
      disabled={isDisabled}
      {...rest}
      {...directiveEvents}
      onClick={e => {
        onClick?.(e)
        if (e.defaultPrevented || isDisabled) return
        setValue(optionValue)
      }}
    >
      <span
        data-state={checked ? 'checked' : 'unchecked'}
        data-slot='radio-indicator'
        className={radioIndicatorStyles}
        style='pointer-events:none'
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='24'
          height='24'
          viewBox='0 0 24 24'
          fill={checked ? 'currentColor' : 'transparent'}
          stroke={checked ? 'currentColor' : 'transparent'}
          stroke-width='2'
          stroke-linecap='round'
          stroke-linejoin='round'
          className='lucide lucide-circle size-2'
        >
          <circle cx='12' cy='12' r='10' />
        </svg>
      </span>
    </button>
  )
}

export default Radio
