import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { render, screen, act } from '@testing-library/react'
import { DebugWindow } from '../src/DebugWindow'
import { useStoryDataStore } from '@/packages/use-story-data-store'
import { useGameStore } from '@/packages/use-game-store'
import i18next from 'i18next'
import type { Element } from 'hast'

const resetStores = async () => {
  useStoryDataStore.setState({
    storyData: {},
    passages: [],
    currentPassageId: undefined
  })
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
    await i18next.init({ lng: 'en-US', resources: {} })
  } else {
    await i18next.changeLanguage('en-US')
    i18next.services.resourceStore.data = {}
  }
}

describe('DebugWindow', () => {
  beforeEach(async () => {
    document.body.innerHTML = ''
    await resetStores()
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

  it('toggles minimized state when clicked', () => {
    useStoryDataStore.setState({ storyData: { options: 'debug' } })
    render(<DebugWindow />)
    const container = screen.getByRole('dialog')
    act(() => {
      container.click()
    })
    expect(screen.getByRole('button', { name: 'Expand' })).toBeInTheDocument()
    act(() => {
      container.click()
    })
    expect(screen.getByRole('button', { name: 'Minimize' })).toBeInTheDocument()
  })

  it('shows game data by default and switches tabs', () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: []
    }
    useStoryDataStore.setState({
      storyData: { options: 'debug', foo: 'bar' },
      passages: [passage]
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
    expect(screen.getByText('Start')).toBeInTheDocument()
  })

  it('shows translations from i18next', () => {
    useStoryDataStore.setState({
      storyData: { options: 'debug' }
    })
    i18next.addResource('en-US', 'translation', 'hello', 'Hello')

    render(<DebugWindow />)

    const transTab = screen.getByRole('button', { name: 'Translations' })
    act(() => {
      transTab.click()
    })
    expect(screen.getByText(/"hello"/)).toBeInTheDocument()
  })

  it('shows errors from the game store', () => {
    useStoryDataStore.setState({ storyData: { options: 'debug' } })
    useGameStore.setState(state => ({
      ...state,
      errors: ['something went wrong']
    }))

    render(<DebugWindow />)

    const errTab = screen.getByRole('button', { name: 'Errors' })
    act(() => {
      errTab.click()
    })
    expect(screen.getByText('something went wrong')).toBeInTheDocument()
  })

  it('shows raw current passage', () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: 'Raw [[Link]]' }]
    }
    useStoryDataStore.setState({
      storyData: { options: 'debug' },
      passages: [passage],
      currentPassageId: '1'
    })
    render(<DebugWindow />)
    const passageTab = screen.getByRole('button', { name: 'Passage' })
    act(() => {
      passageTab.click()
    })
    expect(screen.getByText('Raw [[Link]]')).toBeInTheDocument()
  })

  it('copies raw passage to clipboard', () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: 'Raw [[Link]]' }]
    }
    useStoryDataStore.setState({
      storyData: { options: 'debug' },
      passages: [passage],
      currentPassageId: '1'
    })

    const writeText = mock(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true
    })

    render(<DebugWindow />)
    const passageTab = screen.getByRole('button', { name: 'Passage' })
    act(() => {
      passageTab.click()
    })
    const copyButton = screen.getByRole('button', { name: 'Copy' })
    act(() => {
      copyButton.click()
    })
    expect(writeText).toHaveBeenCalledWith('Raw [[Link]]')
  })
})
