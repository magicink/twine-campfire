import type { ButtonHTMLAttributes } from 'react'
import {
  useStoryDataStore,
  type StoryDataState
} from '@/packages/use-story-data-store'

interface LinkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'data-pid'?: string
  'data-name'?: string
}

export const LinkButton = ({ children, ...rest }: LinkButtonProps) => {
  const setCurrent = useStoryDataStore(
    (state: StoryDataState) => state.setCurrentPassage
  )
  const pid = rest['data-pid']
  const name = rest['data-name']
  return (
    <button
      type='button'
      {...rest}
      onClick={() => {
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
