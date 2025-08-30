import type { JSX } from 'preact'
import { useEffect } from 'preact/hooks'
import { useDirectiveEvents } from '@campfire/hooks/useDirectiveEvents'
import { mergeClasses } from '@campfire/utils/core'
import { useGameStore } from '@campfire/state/useGameStore'
import { radioStyles, radioIndicatorStyles } from '@campfire/utils/remarkStyles'

interface RadioProps
  extends Omit<
    JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    | 'className'
    | 'value'
    | 'defaultValue'
    | 'onFocus'
    | 'onBlur'
    | 'onMouseEnter'
  > {
  /** Key in game state to bind the radio selection to. */
  stateKey: string
  /** Value represented by this radio button. */
  value: string
  /** Additional CSS classes for the radio element. */
  className?: string | string[]
  /** Serialized directives to run when hovered. */
  onHover?: string
  /** Serialized directives to run on focus. */
  onFocus?: string
  /** Serialized directives to run on blur. */
  onBlur?: string
  /** Initial value if the state key is unset. */
  initialValue?: string
}

/**
 * Radio button bound to a game state key. Updates the key to its value on click.
 *
 * @param stateKey - Key in game state to store the selected value.
 * @param value - Value represented by this radio button.
 * @param className - Optional additional classes.
 * @param onHover - Serialized directives to run when hovered.
 * @param onFocus - Serialized directives to run on focus.
 * @param onBlur - Serialized directives to run on blur.
 * @param rest - Additional button element attributes.
 * @returns The rendered radio element.
 */
export const Radio = ({
  stateKey,
  value: optionValue,
  className,
  onHover,
  onFocus,
  onBlur,
  onClick,
  initialValue,
  ...rest
}: RadioProps) => {
  const value = useGameStore(state => state.gameData[stateKey]) as
    | string
    | undefined
  const directiveEvents = useDirectiveEvents(onHover, onFocus, onBlur)
  const setGameData = useGameStore(state => state.setGameData)
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
      {...rest}
      {...directiveEvents}
      onClick={e => {
        onClick?.(e)
        if (e.defaultPrevented) return
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
