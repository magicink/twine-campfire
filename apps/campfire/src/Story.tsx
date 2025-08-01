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
  const locale = useStoryDataStore(state => state.locale)
  useEffect(() => {
    initialize()
    if (!i18next.isInitialized) {
      void i18next.use(initReactI18next).init({
        lng: locale,
        resources: {}
      })
    } else if (i18next.language !== locale) {
      void i18next.changeLanguage(locale)
    }
  }, [locale])

  return (
    <div className={'absolute inset-0 overflow-y-auto overflow-x-hidden'}>
      {passage ? <Passage /> : null}
      <DebugWindow />
    </div>
  )
}
