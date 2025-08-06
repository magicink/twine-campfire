import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, act } from '@testing-library/react'
import { Show } from '../src/Show'
import { useGameStore } from '@/packages/use-game-store'

/**
 * Resets the game store to an empty state before each test.
 */
beforeEach(() => {
  useGameStore.setState({
    gameData: {},
    _initialGameData: {},
    lockedKeys: {},
    onceKeys: {},
    checkpoints: {},
    errors: [],
    loading: false
  })
})

describe('Show', () => {
  it('renders the value for a given key', () => {
    useGameStore.getState().setGameData({ hp: 5 })
    render(<Show data-key='hp' />)
    expect(screen.getByText('5')).toBeInTheDocument()
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
