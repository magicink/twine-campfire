import { useEffect } from 'react'
import { initialize } from '../lib'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
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
    if (!i18next.isInitialized) {
      void i18next.use(initReactI18next).init({
        lng: i18next.language || 'en-US',
        resources: {}
      })
    }
  }, [])

  return (
    <div className={'absolute inset-0 overflow-y-auto overflow-x-hidden'}>
      {passage ? <Passage /> : null}
      <DebugWindow />
    </div>
  )
}
