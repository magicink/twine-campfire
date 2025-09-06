import type { RootContent } from 'mdast'
import rfdc from 'rfdc'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { runDirectiveBlock } from '@campfire/utils/directiveUtils'
import { mergeClasses, parseDisabledAttr } from '@campfire/utils/core'
import { buttonBaseClasses } from './buttonBaseClasses'
import type { JSX } from 'preact'
import { useDirectiveEvents } from '@campfire/hooks/useDirectiveEvents'
import { useGameStore } from '@campfire/state/useGameStore'

const clone = rfdc()

interface TriggerButtonProps
  extends Omit<
    JSX.HTMLAttributes<HTMLButtonElement>,
    | 'className'
    | 'onMouseEnter'
    | 'onMouseLeave'
    | 'onFocus'
    | 'onBlur'
    | 'disabled'
  > {
  className?: string | string[]
  content: string
  /** Boolean or state key controlling the disabled state. */
  disabled?: boolean | string
  /** Serialized directives to run on mouse enter. */
  onMouseEnter?: string
  /** Serialized directives to run on mouse leave. */
  onMouseLeave?: string
  /** Serialized directives to run on focus. */
  onFocus?: string
  /** Serialized directives to run on blur. */
  onBlur?: string
}

/**
 * Button that processes directive content when clicked.
 *
 * @param className - Optional CSS classes.
 * @param content - Serialized directive block.
 * @param children - Button label.
 * @param disabled - Disables the button when true.
 * @param style - Optional inline styles.
 * @param onMouseEnter - Serialized directives to run on mouse enter.
 * @param onMouseLeave - Serialized directives to run on mouse leave.
 * @param onFocus - Serialized directives to run on focus.
 * @param onBlur - Serialized directives to run on blur.
 */
export const TriggerButton = ({
  className,
  content,
  children,
  disabled,
  style,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onClick,
  ...rest
}: TriggerButtonProps) => {
  const handlers = useDirectiveHandlers()
  const directiveEvents = useDirectiveEvents(
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur
  )
  const isDisabled = useGameStore(state =>
    parseDisabledAttr(disabled, state.gameData)
  )
  return (
    <button
      type='button'
      data-testid='trigger-button'
      className={mergeClasses('campfire-trigger', buttonBaseClasses, className)}
      disabled={isDisabled}
      style={style}
      {...rest}
      {...directiveEvents}
      onClick={e => {
        e.stopPropagation()
        onClick?.(e)
        if (e.defaultPrevented || isDisabled) return
        runDirectiveBlock(clone(JSON.parse(content)) as RootContent[], handlers)
      }}
    >
      {children}
    </button>
  )
}
