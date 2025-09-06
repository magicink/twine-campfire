import type { JSX } from 'preact'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { mergeClasses } from '@campfire/utils/core'
import { buttonBaseClasses } from './buttonBaseClasses'

interface LinkButtonProps
  extends Omit<JSX.HTMLAttributes<HTMLButtonElement>, 'className'> {
  'data-pid'?: string
  'data-name'?: string
  disabled?: boolean
  className?: string | string[]
}

/**
 * Button that navigates to another passage when clicked.
 *
 * @param children - Button label.
 * @param onClick - Optional click handler.
 * @param className - Optional CSS classes.
 * @param rest - Additional button properties including passage identifiers.
 */
export const LinkButton = ({
  children,
  onClick,
  className,
  ...rest
}: LinkButtonProps) => {
  const setCurrentPassage = useStoryDataStore.use.setCurrentPassage()
  const pid = rest['data-pid']
  const name = rest['data-name']
  return (
    <button
      type='button'
      data-testid='link-button'
      className={mergeClasses('campfire-link', buttonBaseClasses, className)}
      {...rest}
      onClick={e => {
        e.stopPropagation()
        onClick?.(e)
        if (e.defaultPrevented) return
        const target = pid ?? name
        if (target) {
          setCurrentPassage(target)
        }
      }}
    >
      {children}
    </button>
  )
}
