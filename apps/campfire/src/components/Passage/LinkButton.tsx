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
      className={[
        'campfire-link',
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3",
        className
      ]
        .filter((c, i, arr) => c && arr.indexOf(c) === i)
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
