import type { JSX } from 'preact'
import { useEffect } from 'preact/hooks'
import rfdc from 'rfdc'
import type { RootContent } from 'mdast'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { runDirectiveBlock } from '@campfire/utils/directiveUtils'
import { useGameStore } from '@campfire/state/useGameStore'
import {
  checkboxStyles,
  checkboxIndicatorStyles
} from '@campfire/utils/remarkStyles'

const clone = rfdc()

interface CheckboxProps
  extends Omit<
    JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    | 'className'
    | 'value'
    | 'defaultValue'
    | 'onFocus'
    | 'onBlur'
    | 'onMouseEnter'
  > {
  /** Key in game state to bind the checkbox value to. */
  stateKey: string
  /** Additional CSS classes for the checkbox element. */
  className?: string | string[]
  /** Serialized directives to run when hovered. */
  onHover?: string
  /** Serialized directives to run on focus. */
  onFocus?: string
  /** Serialized directives to run on blur. */
  onBlur?: string
  /** Initial value if the state key is unset. */
  initialValue?: boolean
}

/**
 * Checkbox bound to a game state key. Updates the key on user interaction.
 *
 * @param stateKey - Key in game state to store the value.
 * @param className - Optional additional classes.
 * @param onHover - Serialized directives to run when hovered.
 * @param onFocus - Serialized directives to run on focus.
 * @param onBlur - Serialized directives to run on blur.
 * @param rest - Additional button element attributes.
 * @returns The rendered checkbox element.
 */
export const Checkbox = ({
  stateKey,
  className,
  onHover,
  onFocus,
  onBlur,
  onClick,
  initialValue,
  ...rest
}: CheckboxProps) => {
  const value = useGameStore(state => state.gameData[stateKey]) as
    | boolean
    | string
    | undefined
  const handlers = useDirectiveHandlers()
  const setGameData = useGameStore(state => state.setGameData)
  useEffect(() => {
    if (value === undefined) {
      const init =
        typeof initialValue === 'string'
          ? initialValue === 'true'
          : (initialValue ?? false)
      setGameData({ [stateKey]: init })
    }
  }, [value, stateKey, initialValue, setGameData])
  const classes = Array.isArray(className)
    ? className
    : className
      ? [className]
      : []
  const checked = typeof value === 'string' ? value === 'true' : Boolean(value)
  return (
    <button
      type='button'
      role='checkbox'
      data-testid='checkbox'
      className={['campfire-checkbox', checkboxStyles, ...classes]
        .filter((c, i, arr) => c && arr.indexOf(c) === i)
        .join(' ')}
      aria-checked={checked}
      data-state={checked ? 'checked' : 'unchecked'}
      {...rest}
      onMouseEnter={e => {
        if (onHover) {
          runDirectiveBlock(
            clone(JSON.parse(onHover)) as RootContent[],
            handlers
          )
        }
      }}
      onFocus={e => {
        if (onFocus) {
          runDirectiveBlock(
            clone(JSON.parse(onFocus)) as RootContent[],
            handlers
          )
        }
      }}
      onBlur={e => {
        if (onBlur) {
          runDirectiveBlock(
            clone(JSON.parse(onBlur)) as RootContent[],
            handlers
          )
        }
      }}
      onClick={e => {
        onClick?.(e)
        if (e.defaultPrevented) return
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
