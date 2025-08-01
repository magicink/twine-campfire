import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen } from '@testing-library/react'
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
    locale: 'en-US',
    lockedKeys: {}
  })
}

describe('Passage', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    resetStore()
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

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).visited
    ).toBe('true')
  })
})
