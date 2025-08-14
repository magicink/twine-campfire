import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, act } from '@testing-library/preact'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { Show } from '@campfire/components/Passage/Show'
import { useGameStore } from '@campfire/use-game-store'

/**
 * Resets the game store to an empty state before each test.
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

describe('Show', () => {
  it('renders the value for a given key', () => {
    useGameStore.getState().setGameData({ hp: 5 })
    render(<Show data-key='hp' />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders the value of range objects', () => {
    useGameStore.getState().setGameData({ hp: { min: 0, max: 10, value: 4 } })
    render(<Show data-key='hp' />)
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('updates when the value changes', () => {
    useGameStore.getState().setGameData({ hp: 3 })
    render(<Show data-key='hp' />)
    act(() => {
      useGameStore.getState().setGameData({ hp: 7 })
    })
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('renders nothing when the value is undefined', () => {
    const { container } = render(<Show data-key='hp' />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the value is null', () => {
    useGameStore.getState().setGameData({ hp: null })
    const { container } = render(<Show data-key='hp' />)
    expect(container).toBeEmptyDOMElement()
  })
})
