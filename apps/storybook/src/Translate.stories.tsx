import type { Meta, StoryObj } from '@storybook/preact'
import { h } from 'preact'
import { useState } from 'preact/hooks'
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
    const [lang, setLang] = useState('en-US')

    /**
     * Initializes i18next with translation resources and updates language.
     */
    const init = async () => {
      if (!i18next.isInitialized) {
        await i18next.use(initReactI18next).init({
          lng: lang,
          resources: {
            'en-US': { translation: { hello: 'Hello, {{player}}!' } },
            fr: { translation: { hello: 'Bonjour {{player}}!' } },
            th: { translation: { hello: 'สวัสดี {{player}}!' } },
            ja: { translation: { hello: 'こんにちは、{{player}}さん！' } }
          },
          fallbackLng: 'en-US',
          interpolation: { escapeValue: false }
        })
      } else {
        await i18next.changeLanguage(lang)
      }
    }

    void init()

    useGameStore.getState().setGameData({ greet: 'hello', player: 'Sam' })
    const player = useGameStore.getState().gameData.player as string
    return (
      <div className='flex flex-col gap-2'>
        <select
          className='campfire-language-select bg-black text-white p-2 rounded'
          data-testid='language-select'
          value={lang}
          onChange={e => setLang((e.target as HTMLSelectElement).value)}
        >
          <option value='en-US'>English</option>
          <option value='fr'>Français</option>
          <option value='th'>ไทย</option>
          <option value='ja'>日本語</option>
        </select>
        <Translate
          data-i18n-key='hello'
          className='text-[var(--color-primary-300)]'
          data-i18n-vars={`{"player": "${player}"}`}
        />
        <Translate
          data-i18n-key='missing'
          data-i18n-fallback={`Hello, ${player}! (In case the key is missing)`}
          className='text-[var(--color-primary-500)]'
        />
      </div>
    )
  }
}
