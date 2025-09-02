import type { JSX } from 'preact'
import { useEffect } from 'preact/hooks'
import { useDirectiveEvents } from '@campfire/hooks/useDirectiveEvents'
import { mergeClasses } from '@campfire/utils/core'
import { useGameStore } from '@campfire/state/useGameStore'

const textareaStyles =
  'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'

interface TextareaProps
  extends Omit<
    JSX.TextareaHTMLAttributes<HTMLTextAreaElement>,
    | 'className'
    | 'value'
    | 'defaultValue'
    | 'onFocus'
    | 'onBlur'
    | 'onMouseEnter'
    | 'onMouseLeave'
    | 'disabled'
  > {
  /** Key in game state to bind the textarea value to. */
  stateKey: string
  /** Additional CSS classes for the textarea element. */
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
 * Textarea bound to a game state key. Updates the key on user input.
 *
 * @param stateKey - Key in game state to store the value.
 * @param className - Optional additional classes.
 * @param onMouseEnter - Serialized directives to run on mouse enter.
 * @param onMouseLeave - Serialized directives to run on mouse leave.
 * @param onFocus - Serialized directives to run on focus.
 * @param onBlur - Serialized directives to run on blur.
 * @param rest - Additional textarea element attributes.
 * @returns The rendered textarea element.
 */
export const Textarea = ({
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
}: TextareaProps) => {
  const value = useGameStore(state => state.gameData[stateKey]) as
    | string
    | undefined
  const disabledState = useGameStore(state =>
    typeof disabled === 'string' &&
    disabled !== '' &&
    disabled !== 'true' &&
    disabled !== 'false'
      ? state.gameData[disabled]
      : undefined
  ) as unknown
  const isDisabled =
    typeof disabled === 'string'
      ? disabled === '' || disabled === 'true'
        ? true
        : disabled === 'false'
          ? false
          : Boolean(disabledState)
      : Boolean(disabled)
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
    <textarea
      data-testid='textarea'
      className={mergeClasses('campfire-textarea', textareaStyles, className)}
      value={value ?? ''}
      disabled={isDisabled}
      {...rest}
      {...directiveEvents}
      onInput={e => {
        onInput?.(e)
        if (e.defaultPrevented) return
        const target = e.currentTarget as HTMLTextAreaElement
        setGameData({ [stateKey]: target.value })
      }}
    />
  )
}

export default Textarea
