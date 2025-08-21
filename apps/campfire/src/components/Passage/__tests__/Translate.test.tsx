import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen } from '@testing-library/preact'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { Translate } from '@campfire/components/Passage/Translate'
import { useGameStore } from '@campfire/state/useGameStore'

/**
 * Resets stores and i18n before each test.
 */
beforeEach(async () => {
  useGameStore.setState({
    gameData: {},
    _initialGameData: {},
    lockedKeys: {},
    onceKeys: {},
    checkpoints: {},
    errors: [],
    loading: false
  })
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({ lng: 'en-US', resources: {} })
  } else {
    await i18next.changeLanguage('en-US')
    i18next.services.resourceStore.data = {}
  }
})

describe('Translate', () => {
  it('renders a translated string', () => {
    i18next.addResource('en-US', 'translation', 'hello', 'Hello')
    render(<Translate data-i18n-key='hello' />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
