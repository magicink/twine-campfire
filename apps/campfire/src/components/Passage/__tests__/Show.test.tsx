import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, act } from '@testing-library/preact'
import { Show } from '@campfire/components/Passage/Show'
import { useGameStore } from '@campfire/state/useGameStore'

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
    const { container } = render(<Show data-key='hp' />)
    expect(container.textContent).toBe('5')
  })

  it('renders the value of range objects', () => {
    useGameStore.getState().setGameData({ hp: { min: 0, max: 10, value: 4 } })
    const { container } = render(<Show data-key='hp' />)
    expect(container.textContent).toBe('4')
  })

  it('updates when the value changes', () => {
    useGameStore.getState().setGameData({ hp: 3 })
    const { container } = render(<Show data-key='hp' />)
    act(() => {
      useGameStore.getState().setGameData({ hp: 7 })
    })
    expect(container.textContent).toBe('7')
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

  it('renders the result of an expression', () => {
    useGameStore.getState().setGameData({ some_key: 2 })
    const { container } = render(<Show data-expr='some_key > 1 ? "X" : " "' />)
    expect(container.textContent).toBe('X')
  })

  it('renders with a span wrapper by default and applies styling', () => {
    useGameStore.getState().setGameData({ hp: 10 })
    render(<Show data-key='hp' className='stat' style={{ color: 'red' }} />)
    const el = screen.getByTestId('show') as HTMLElement
    expect(el.tagName).toBe('SPAN')
    expect(el.className).toContain('campfire-show')
    expect(el.className).toContain('stat')
    expect(el.style.color).toBe('red')
  })

  it('renders inside a custom element when `as` is provided', () => {
    useGameStore.getState().setGameData({ hp: 10 })
    render(<Show as='em' data-key='hp' />)
    const el = screen.getByTestId('show') as HTMLElement
    expect(el.tagName).toBe('EM')
  })
})
