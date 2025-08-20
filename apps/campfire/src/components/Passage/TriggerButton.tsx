import type { RootContent } from 'mdast'
import rfdc from 'rfdc'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { runDirectiveBlock } from '@campfire/utils/directives'
import type { JSX } from 'preact'

const clone = rfdc()

interface TriggerButtonProps {
  className?: string | string[]
  content: string
  children?: string
  disabled?: boolean
  style?: JSX.CSSProperties
}

/**
 * Button that processes directive content when clicked.
 *
 * @param className - Optional CSS classes.
 * @param content - Serialized directive block.
 * @param children - Button label.
 * @param disabled - Disables the button when true.
 * @param style - Optional inline styles.
 */
export const TriggerButton = ({
  className,
  content,
  children,
  disabled,
  style
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
      onClick={e => {
        e.stopPropagation()
        runDirectiveBlock(clone(JSON.parse(content)) as RootContent[], handlers)
      }}
    >
      {children}
    </button>
  )
}
