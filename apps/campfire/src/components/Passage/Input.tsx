import { useEffect } from 'preact/hooks'
import { useDirectiveEvents } from '@campfire/hooks/useDirectiveEvents'
import { mergeClasses, parseDisabledAttr } from '@campfire/utils/core'
import { useGameStore } from '@campfire/state/useGameStore'
import { fieldBaseStyles, type BoundFieldElementProps } from './BoundFieldProps'

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
  const gameData = useGameStore.use.gameData()
  const value = gameData[stateKey] as string | undefined
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
