import type { JSX } from 'preact'
import {
  useStoryDataStore,
  type StoryDataState
} from '@campfire/state/useStoryDataStore'

interface LinkButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  'data-pid'?: string
  'data-name'?: string
  disabled?: boolean
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
  const setCurrent = useStoryDataStore(
    (state: StoryDataState) => state.setCurrentPassage
  )
  const pid = rest['data-pid']
  const name = rest['data-name']
  return (
    <button
      type='button'
      data-testid='link-button'
      className={['font-libertinus', 'disabled:opacity-50', className]
        .filter(c => c != null && c !== '')
        .join(' ')}
      {...rest}
      onClick={e => {
        e.stopPropagation()
        onClick?.(e)
        if (e.defaultPrevented) return
        const target = pid ?? name
        if (target) {
          setCurrent(target)
        }
      }}
    >
      {children}
    </button>
  )
}
