import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, waitFor } from '@testing-library/react'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Element } from 'hast'
import { Passage } from '../src/Passage'
import { useStoryDataStore } from '@/packages/use-story-data-store'
import { useGameStore } from '@/packages/use-game-store'

const resetStore = () => {
  useStoryDataStore.setState({
    storyData: {},
    passages: [],
    currentPassageId: undefined
  })
  useGameStore.setState({
    gameData: {},
    _initialGameData: {},
    lockedKeys: {}
  })
}

describe('Passage', () => {
  beforeEach(async () => {
    document.body.innerHTML = ''
    resetStore()
    if (!i18next.isInitialized) {
      await i18next.use(initReactI18next).init({ lng: 'en-US', resources: {} })
    } else {
      await i18next.changeLanguage('en-US')
      i18next.services.resourceStore.data = {}
    }
  })

  it('renders the current passage', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: 'Hello **world**' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText(/Hello/)
    expect(text).toBeInTheDocument()
  })

  it('renders nothing when no passage is set', () => {
    render(<Passage />)
    expect(document.body.textContent).toBe('')
  })

  it('navigates to the linked passage when a button is clicked', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: 'Go to [[Next]]' }]
    }
    const next: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Next' },
      children: []
    }

    useStoryDataStore.setState({
      passages: [start, next],
      currentPassageId: '1'
    })

    render(<Passage />)

    const button = await screen.findByRole('button', { name: 'Next' })
    button.click()
    expect(useStoryDataStore.getState().currentPassageId).toBe('Next')
  })

  it('renders included passage content', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':include[Second]' }]
    }
    const second: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Second' },
      children: [{ type: 'text', value: 'Inner text' }]
    }

    useStoryDataStore.setState({
      passages: [start, second],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText('Inner text')
    expect(text).toBeInTheDocument()
  })

  it('evaluates directives within included passages', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':include[Second]' }]
    }
    const second: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Second' },
      children: [{ type: 'text', value: ':set{visited=true}' }]
    }

    useStoryDataStore.setState({
      passages: [start, second],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() =>
      expect(
        (useGameStore.getState().gameData as Record<string, unknown>).visited
      ).toBe('true')
    )
  })

  it('executes the set directive', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':set[number]{hp=5}' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() =>
      expect(
        (useGameStore.getState().gameData as Record<string, unknown>).hp
      ).toBe(5)
    )
  })

  it('locks keys with setOnce', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':setOnce[number]{gold=10}' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() =>
      expect(
        (useGameStore.getState().gameData as Record<string, unknown>).gold
      ).toBe(10)
    )
    expect(useGameStore.getState().lockedKeys.gold).toBe(true)

    useGameStore.getState().setGameData({ gold: 5 })

    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).gold
    ).toBe(10)
  })

  it('retrieves values with get directive', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { score: 7 }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: 'Score: :get{score}' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText('Score: 7')
    expect(text).toBeInTheDocument()
  })

  it('increments values', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { count: 1 }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':increment{key=count amount=2}' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() =>
      expect(
        (useGameStore.getState().gameData as Record<string, unknown>).count
      ).toBe(3)
    )
  })

  it('decrements values', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { count: 3 }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':decrement{key=count amount=1}' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() =>
      expect(
        (useGameStore.getState().gameData as Record<string, unknown>).count
      ).toBe(2)
    )
  })

  it('unsets game data with the unset directive', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { flag: true }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':unset{key=flag}' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() =>
      expect(
        (useGameStore.getState().gameData as Record<string, unknown>).flag
      ).toBeUndefined()
    )
  })

  it('chooses the correct branch with the if directive', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':::if{true}\nShown\n:::else\nHidden\n:::'
        }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText('Shown')
    expect(text).toBeInTheDocument()
    expect(document.body.textContent).not.toContain('Hidden')
  })

  it('changes locale with lang directive', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':lang{locale=fr-FR}' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      expect(i18next.language).toBe('fr-FR')
    })
  })

  it('retrieves translations with t directive', async () => {
    i18next.addResource('en-US', 'translation', 'hello', 'Hello')
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':t{key=hello}' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText('Hello')
    expect(text).toBeInTheDocument()
  })
})
