import type { RootContent } from 'mdast'
import rfdc from 'rfdc'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { runDirectiveBlock } from '@campfire/utils/directiveUtils'
import type { JSX } from 'preact'

const clone = rfdc()

interface TriggerButtonProps
  extends Omit<
    JSX.HTMLAttributes<HTMLButtonElement>,
    'className' | 'onMouseEnter' | 'onFocus' | 'onBlur'
  > {
  className?: string | string[]
  content: string
  children?: string
  disabled?: boolean
  /** Serialized directives to run when hovered. */
  onHover?: string
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
 * @param onHover - Serialized directives to run when hovered.
 * @param onFocus - Serialized directives to run on focus.
 * @param onBlur - Serialized directives to run on blur.
 */
export const TriggerButton = ({
  className,
  content,
  children,
  disabled,
  style,
  onHover,
  onFocus,
  onBlur,
  onClick,
  ...rest
}: TriggerButtonProps) => {
  const handlers = useDirectiveHandlers()
  const classes = Array.isArray(className)
    ? className
    : className
      ? [className]
      : []
  return (
    <button
      type='button'
      data-testid='trigger-button'
      className={[
        'campfire-trigger',
        'font-libertinus',
        'disabled:opacity-50',
        ...classes
      ].join(' ')}
      disabled={disabled}
      style={style}
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
        e.stopPropagation()
        onClick?.(e)
        if (e.defaultPrevented || disabled) return
        runDirectiveBlock(clone(JSON.parse(content)) as RootContent[], handlers)
      }}
    >
      {children}
    </button>
  )
}
