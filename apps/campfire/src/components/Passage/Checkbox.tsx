import { useEffect } from 'preact/hooks'
import { useDirectiveEvents } from '@campfire/hooks/useDirectiveEvents'
import { mergeClasses, parseDisabledAttr } from '@campfire/utils/core'
import { useGameStore } from '@campfire/state/useGameStore'
import {
  checkboxStyles,
  checkboxIndicatorStyles
} from '@campfire/utils/remarkStyles'
import type { BoundFieldElementProps } from './BoundFieldProps'

type CheckboxProps = BoundFieldElementProps<HTMLButtonElement, boolean>

/**
 * Checkbox bound to a game state key. Updates the key on user interaction.
 *
 * @param stateKey - Key in game state to store the value.
 * @param className - Optional additional classes.
 * @param onMouseEnter - Serialized directives to run on mouse enter.
 * @param onMouseLeave - Serialized directives to run on mouse leave.
 * @param onFocus - Serialized directives to run on focus.
 * @param onBlur - Serialized directives to run on blur.
 * @param rest - Additional button element attributes.
 * @returns The rendered checkbox element.
 */
export const Checkbox = ({
  stateKey,
  className,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onClick,
  initialValue,
  disabled,
  ...rest
}: CheckboxProps) => {
  const gameData = useGameStore.use.gameData()
  const value = gameData[stateKey] as boolean | string | undefined
  const isDisabled = parseDisabledAttr(disabled, gameData)
  const directiveEvents = useDirectiveEvents(
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur
  )
  const setGameData = useGameStore.use.setGameData()
  useEffect(() => {
    if (value === undefined) {
      const init =
        typeof initialValue === 'string'
          ? initialValue === 'true'
          : (initialValue ?? false)
      setGameData({ [stateKey]: init })
    }
  }, [value, stateKey, initialValue, setGameData])
  const checked = typeof value === 'string' ? value === 'true' : Boolean(value)
  return (
    <button
      type='button'
      role='checkbox'
      data-testid='checkbox'
      className={mergeClasses('campfire-checkbox', checkboxStyles, className)}
      aria-checked={checked}
      data-state={checked ? 'checked' : 'unchecked'}
      disabled={isDisabled}
      {...rest}
      {...directiveEvents}
      onClick={e => {
        onClick?.(e)
        if (e.defaultPrevented || isDisabled) return
        setGameData({ [stateKey]: !checked })
      }}
    >
      <span
        data-state={checked ? 'checked' : 'unchecked'}
        data-slot='checkbox-indicator'
        className={checkboxIndicatorStyles}
        style='pointer-events:none'
      >
        {checked && (
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            stroke-width='2'
            stroke-linecap='round'
            stroke-linejoin='round'
            className='lucide lucide-check size-3.5'
          >
            <path d='M20 6 9 17l-5-5' />
          </svg>
        )}
      </span>
    </button>
  )
}

export default Checkbox
