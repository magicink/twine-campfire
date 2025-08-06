import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, waitFor, act } from '@testing-library/react'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Element } from 'hast'
import { Passage } from '../src/Passage'
import { useStoryDataStore } from '@/packages/use-story-data-store'
import { useGameStore } from '@/packages/use-game-store'
import { resetStores } from './helpers'

describe('Passage lifecycle directives', () => {
  beforeEach(async () => {
    document.body.innerHTML = ''
    resetStores()
    if (!i18next.isInitialized) {
      await i18next.use(initReactI18next).init({ lng: 'en-US', resources: {} })
    } else {
      await i18next.changeLanguage('en-US')
      i18next.services.resourceStore.data = {}
    }
  })

  it('executes once blocks only once', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':::once{intro}\nHello\n:::' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    const { rerender } = render(<Passage />)

    const text = await screen.findByText('Hello')
    expect(text).toBeInTheDocument()

    act(() => {
      useStoryDataStore.setState({ currentPassageId: undefined })
    })
    rerender(<Passage />)

    act(() => {
      useStoryDataStore.setState({ currentPassageId: '1' })
    })
    rerender(<Passage />)
    await waitFor(() => {
      expect(screen.queryByText('Hello')).toBeNull()
    })
  })

  it('runs onEnter and onExit blocks at the appropriate times', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::onEnter\n:::set{key=entered value=true}\n:::\n:::onExit\n:::set{key=exited value=true}\n:::\n[[Next]]'
        }
      ]
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

    await waitFor(() => {
      expect(useGameStore.getState().gameData.entered).toBe('true')
    })

    const button = await screen.findByRole('button', { name: 'Next' })
    act(() => {
      button.click()
    })

    await waitFor(() => {
      expect(useGameStore.getState().gameData.exited).toBe('true')
    })
  })

  it('runs onChange blocks when a key updates and cleans up on exit', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::onChange{key=hp}\n:::set{key=changed value=true}\n:::\n:::\n'
        }
      ]
    }
    const next: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Next' },
      children: []
    }

    useGameStore.getState().init({ hp: 1 })
    useStoryDataStore.setState({
      passages: [start, next],
      currentPassageId: '1'
    })

    render(<Passage />)

    act(() => {
      useGameStore.getState().setGameData({ hp: 2 })
    })

    await waitFor(() => {
      expect(useGameStore.getState().gameData.changed).toBe('true')
    })

    act(() => {
      useGameStore.getState().unsetGameData('changed')
      useStoryDataStore.getState().setCurrentPassage('2')
    })

    act(() => {
      useGameStore.getState().setGameData({ hp: 3 })
    })

    expect(useGameStore.getState().gameData.changed).toBeUndefined()
  })
})
