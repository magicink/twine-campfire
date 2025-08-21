import type { Meta, StoryObj } from '@storybook/preact'
import { h } from 'preact'
import { Translate } from '@campfire/components'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { useGameStore } from '@campfire/state/useGameStore'

const meta: Meta<typeof Translate> = {
  component: Translate,
  title: 'Campfire/Translate'
}

export default meta

/**
 * Displays translated strings using i18next.
 *
 * @returns Example translations.
 */
export const Examples: StoryObj<typeof Translate> = {
  render: () => {
    if (!i18next.isInitialized) {
      i18next.use(initReactI18next).init({
        lng: 'en-US',
        resources: { 'en-US': { translation: { hello: 'Hello' } } }
      })
    } else {
      i18next.changeLanguage('en-US')
      i18next.addResource('en-US', 'translation', 'hello', 'Hello')
    }
    useGameStore.getState().setGameData({ greet: 'hello' })
    return (
      <div className='flex flex-col gap-2'>
        <Translate data-i18n-key='hello' />
        <Translate data-i18n-expr='greet' />
      </div>
    )
  }
}
