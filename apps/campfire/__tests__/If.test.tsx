import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { If } from '../src/If'
import { useGameStore } from '@/packages/use-game-store'

const makeContent = (text: string) =>
  JSON.stringify([
    { type: 'paragraph', children: [{ type: 'text', value: text }] }
  ])

describe('If', () => {
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
  it('renders content when condition is true', () => {
    render(<If test='true' content={makeContent('Hello')} />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('renders fallback when condition is false', () => {
    render(
      <If
        test='false'
        content={makeContent('Content')}
        fallback={makeContent('Fallback')}
      />
    )
    expect(screen.getByText('Fallback')).toBeInTheDocument()
  })

  it('renders nothing when condition is false and no fallback', () => {
    const { container } = render(
      <If test='false' content={makeContent('Nope')} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('uses game data in expressions', () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { some_key: true }
    }))
    render(<If test='some_key' content={makeContent('Yes')} />)
    expect(screen.getByText('Yes')).toBeInTheDocument()
  })

  it('supports negation', () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { some_key: false }
    }))
    render(<If test='!some_key' content={makeContent('Yes')} />)
    expect(screen.getByText('Yes')).toBeInTheDocument()
  })

  it('supports double negation', () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { some_key: 'value' }
    }))
    render(<If test='!!some_key' content={makeContent('Yes')} />)
    expect(screen.getByText('Yes')).toBeInTheDocument()
  })

  it('compares values', () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { key_a: 1, key_b: 2 }
    }))
    render(<If test='key_a < key_b' content={makeContent('Yes')} />)
    expect(screen.getByText('Yes')).toBeInTheDocument()
  })

  it('checks types', () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { key_a: 1 }
    }))
    render(<If test='typeof key_a !== "string"' content={makeContent('Yes')} />)
    expect(screen.getByText('Yes')).toBeInTheDocument()
  })
})
