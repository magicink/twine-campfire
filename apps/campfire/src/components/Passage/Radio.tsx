import type { JSX } from 'preact'
import { useEffect } from 'preact/hooks'
import { useDirectiveEvents } from '@campfire/hooks/useDirectiveEvents'
import { mergeClasses, evalExpression } from '@campfire/utils/core'
import { useGameStore } from '@campfire/state/useGameStore'
import { radioStyles, radioIndicatorStyles } from '@campfire/utils/remarkStyles'
import type { BoundFieldProps } from './BoundFieldProps'

interface RadioProps
  extends Omit<
      JSX.ButtonHTMLAttributes<HTMLButtonElement>,
      | 'className'
      | 'value'
      | 'defaultValue'
      | 'onFocus'
      | 'onBlur'
      | 'onMouseEnter'
      | 'onMouseLeave'
      | 'disabled'
    >,
    BoundFieldProps<string> {
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
  const gameData = useGameStore.use.gameData()
  const value = gameData[stateKey] as string | undefined
  const isDisabled = (() => {
    if (typeof disabled === 'string') {
      if (disabled === '' || disabled === 'true') return true
      if (disabled === 'false') return false
      try {
        return Boolean(evalExpression(disabled, gameData))
      } catch {
        return false
      }
    }
    return Boolean(disabled)
  })()
  const directiveEvents = useDirectiveEvents(
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur
  )
  const setGameData = useGameStore.use.setGameData()
  useEffect(() => {
    if (value === undefined && initialValue !== undefined) {
      setGameData({ [stateKey]: initialValue })
    }
  }, [value, stateKey, initialValue, setGameData])
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
        setGameData({ [stateKey]: optionValue })
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
