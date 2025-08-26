import type { JSX } from 'preact'
import rfdc from 'rfdc'
import type { RootContent } from 'mdast'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { runDirectiveBlock } from '@campfire/utils/directiveUtils'
import { useGameStore } from '@campfire/state/useGameStore'

const clone = rfdc()

interface SelectProps
  extends Omit<
    JSX.SelectHTMLAttributes<HTMLSelectElement>,
    'className' | 'value' | 'onInput' | 'onFocus' | 'onBlur' | 'onMouseEnter'
  > {
  /** Key in game state to bind the select value to. */
  stateKey: string
  /** Additional CSS classes for the select element. */
  className?: string | string[]
  /** Serialized directives to run when hovered. */
  onHover?: string
  /** Serialized directives to run on focus. */
  onFocus?: string
  /** Serialized directives to run on blur. */
  onBlur?: string
  /** Optional input event handler. */
  onInput?: JSX.SelectHTMLAttributes<HTMLSelectElement>['onInput']
}

/**
 * Select element bound to a game state key. Updates the key on selection change.
 *
 * @param stateKey - Key in game state to store the selected value.
 * @param className - Optional additional classes.
 * @param onHover - Serialized directives to run when hovered.
 * @param onFocus - Serialized directives to run on focus.
 * @param onBlur - Serialized directives to run on blur.
 * @param rest - Additional select element attributes.
 * @returns The rendered select element.
 */
export const Select = ({
  stateKey,
  className,
  onHover,
  onFocus,
  onBlur,
  onInput,
  children,
  ...rest
}: SelectProps) => {
  const value = useGameStore(state => state.gameData[stateKey]) as
    | string
    | undefined
  const setGameData = useGameStore(state => state.setGameData)
  const handlers = useDirectiveHandlers()
  const classes = Array.isArray(className)
    ? className
    : className
      ? [className]
      : []
  return (
    <select
      data-testid='select'
      className={['campfire-select', ...classes].join(' ')}
      value={value ?? ''}
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
      onInput={e => {
        onInput?.(e)
        if (e.defaultPrevented) return
        const target = e.currentTarget as HTMLSelectElement
        setGameData({ [stateKey]: target.value })
      }}
    >
      {children}
    </select>
  )
}

export default Select
