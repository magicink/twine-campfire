import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, act } from '@testing-library/react'
import { DebugWindow } from '../src/DebugWindow'
import { useStoryDataStore } from '@/packages/use-story-data-store'
import { useGameStore } from '@/packages/use-game-store'

const resetStores = () => {
  useStoryDataStore.setState({
    storyData: {},
    passages: [],
    currentPassageId: undefined
  })
  useGameStore.setState({
    gameData: {},
    _initialGameData: {},
    locale: 'en-US',
    lockedKeys: {}
  })
}

describe('DebugWindow', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    resetStores()
  })

  it('does not render when debug option is false', () => {
    useStoryDataStore.setState({ storyData: { options: 'nope' } })
    render(<DebugWindow />)
    expect(document.body.textContent).toBe('')
  })

  it('renders when debug option is true', () => {
    useStoryDataStore.setState({ storyData: { options: 'debug' } })
    render(<DebugWindow />)
    const header = screen.getByText('Debug')
    expect(header).toBeInTheDocument()
  })

  it('can be dismissed', () => {
    useStoryDataStore.setState({ storyData: { options: 'debug' } })
    render(<DebugWindow />)
    const close = screen.getByRole('button', { name: 'Close debug window' })
    act(() => {
      close.click()
    })
    expect(document.body.textContent).toBe('')
  })

  it('minimizes the entire frame', () => {
    useStoryDataStore.setState({ storyData: { options: 'debug' } })
    render(<DebugWindow />)
    const dialog = screen.getByRole('dialog')
    expect(dialog.className).toContain('bottom-0')
    const minimize = screen.getByRole('button', { name: 'Minimize' })
    act(() => {
      minimize.click()
    })
    expect(dialog.className).not.toContain('bottom-0')
  })

  it('shows game data by default and switches tabs', () => {
    useStoryDataStore.setState({
      storyData: { options: 'debug', foo: 'bar' }
    })
    useGameStore.setState(state => ({
      ...state,
      gameData: { x: 1 }
    }))

    render(<DebugWindow />)
    expect(screen.getByText(/"x": 1/)).toBeInTheDocument()

    const storyTab = screen.getByRole('button', { name: 'Story Data' })
    act(() => {
      storyTab.click()
    })
    expect(screen.getByText(/"foo": "bar"/)).toBeInTheDocument()
  })

  it('lists passages and highlights the current one', () => {
    const start = {
      type: 'element' as const,
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: []
    }
    const next = {
      type: 'element' as const,
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Next' },
      children: []
    }
    useStoryDataStore.setState({
      storyData: { options: 'debug' },
      passages: [start, next],
      currentPassageId: '1'
    })

    render(<DebugWindow />)
    const storyTab = screen.getByRole('button', { name: 'Story Data' })
    act(() => {
      storyTab.click()
    })
    expect(screen.getByText('Start (current)')).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
  })
})
