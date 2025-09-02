import type { RootContent } from 'mdast'
import rfdc from 'rfdc'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { runDirectiveBlock } from '@campfire/utils/directiveUtils'
import { mergeClasses } from '@campfire/utils/core'
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
  return (
    <button
      type='button'
      data-testid='trigger-button'
      className={mergeClasses(
        'campfire-trigger',
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3",
        className
      )}
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
