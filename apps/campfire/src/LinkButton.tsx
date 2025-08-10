import type { JSX } from 'preact'
import {
  useStoryDataStore,
  type StoryDataState
} from '@/packages/use-story-data-store'

interface LinkButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  'data-pid'?: string
  'data-name'?: string
}

export const LinkButton = ({ children, onClick, ...rest }: LinkButtonProps) => {
  const setCurrent = useStoryDataStore(
    (state: StoryDataState) => state.setCurrentPassage
  )
  const pid = rest['data-pid']
  const name = rest['data-name']
  return (
    <button
      type='button'
      {...rest}
      onClick={e => {
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
