import type { JSX } from 'preact'
import { useEffect } from 'preact/hooks'
import { useDirectiveEvents } from '@campfire/hooks/useDirectiveEvents'
import { mergeClasses, evalExpression } from '@campfire/utils/core'
import { useGameStore } from '@campfire/state/useGameStore'

const inputStyles =
  'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'

interface InputProps
  extends Omit<
    JSX.InputHTMLAttributes<HTMLInputElement>,
    | 'className'
    | 'value'
    | 'defaultValue'
    | 'onFocus'
    | 'onBlur'
    | 'onMouseEnter'
    | 'onMouseLeave'
    | 'disabled'
  > {
  /** Key in game state to bind the input value to. */
  stateKey: string
  /** Additional CSS classes for the input element. */
  className?: string | string[]
  /** Serialized directives to run on mouse enter. */
  onMouseEnter?: string
  /** Serialized directives to run on mouse leave. */
  onMouseLeave?: string
  /** Serialized directives to run on focus. */
  onFocus?: string
  /** Serialized directives to run on blur. */
  onBlur?: string
  /** Initial value if the state key is unset. */
  initialValue?: string
  /** Boolean or state key controlling the disabled state. */
  disabled?: boolean | string
}

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
  const value = useGameStore(state => state.gameData[stateKey]) as
    | string
    | undefined
  const isDisabled = useGameStore(state => {
    if (typeof disabled === 'string') {
      if (disabled === '' || disabled === 'true') return true
      if (disabled === 'false') return false
      try {
        return Boolean(evalExpression(disabled, state.gameData))
      } catch {
        return false
      }
    }
    return Boolean(disabled)
  })
  const directiveEvents = useDirectiveEvents(
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur
  )
  const setGameData = useGameStore(state => state.setGameData)
  useEffect(() => {
    if (value === undefined) {
      setGameData({ [stateKey]: initialValue ?? '' })
    }
  }, [value, stateKey, initialValue, setGameData])
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
        setGameData({ [stateKey]: target.value })
      }}
    />
  )
}

export default Input
