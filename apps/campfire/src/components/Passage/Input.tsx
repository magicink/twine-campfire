import type { JSX } from 'preact'
import rfdc from 'rfdc'
import type { RootContent } from 'mdast'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { runDirectiveBlock } from '@campfire/utils/directiveUtils'
import { useGameStore } from '@campfire/state/useGameStore'

const clone = rfdc()

interface InputProps
  extends Omit<
    JSX.InputHTMLAttributes<HTMLInputElement>,
    'className' | 'value' | 'onFocus' | 'onBlur' | 'onMouseEnter'
  > {
  /** Key in game state to bind the input value to. */
  stateKey: string
  /** Additional CSS classes for the input element. */
  className?: string | string[]
  /** Serialized directives to run when hovered. */
  onHover?: string
  /** Serialized directives to run on focus. */
  onFocus?: string
  /** Serialized directives to run on blur. */
  onBlur?: string
}

/**
 * Text input bound to a game state key. Updates the key on user input.
 *
 * @param stateKey - Key in game state to store the value.
 * @param className - Optional additional classes.
 * @param onHover - Serialized directives to run when hovered.
 * @param onFocus - Serialized directives to run on focus.
 * @param onBlur - Serialized directives to run on blur.
 * @param rest - Additional input element attributes.
 * @returns The rendered input element.
 */
export const Input = ({
  stateKey,
  className,
  onHover,
  onFocus,
  onBlur,
  onInput,
  ...rest
}: InputProps) => {
  const value = useGameStore(state => state.gameData[stateKey]) as
    | string
    | undefined
  const handlers = useDirectiveHandlers()
  const setGameData = useGameStore(state => state.setGameData)
  const classes = Array.isArray(className)
    ? className
    : className
      ? [className]
      : []
  return (
    <input
      data-testid='input'
      className={['campfire-input', ...classes].join(' ')}
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
        const target = e.currentTarget as HTMLInputElement
        setGameData({ [stateKey]: target.value })
      }}
    />
  )
}

export default Input
