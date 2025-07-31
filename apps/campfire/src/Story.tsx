import { useEffect } from 'react'
import { initialize } from '../lib'
import {
  useStoryDataStore,
  type StoryDataState
} from '@/packages/use-story-data-store'
import { Passage } from './Passage'
import { DebugWindow } from './DebugWindow'

export const Story = () => {
  const passage = useStoryDataStore((state: StoryDataState) =>
    state.getCurrentPassage()
  )
  useEffect(() => {
    initialize()
  }, [])

  return (
    <div className={'absolute inset-0 overflow-y-auto overflow-x-hidden'}>
      {passage ? <Passage /> : null}
      <DebugWindow />
    </div>
  )
}
