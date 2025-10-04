import { describe, it, beforeEach, expect, vi } from 'bun:test'
import { render, screen, waitFor, act } from '@testing-library/preact'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { useGameStore } from '@campfire/state/useGameStore'
import { resetStores } from '@campfire/test-utils/helpers'

describe('effect directive', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    resetStores()
  })

  it('renders effect blocks without displaying content', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: 'Visible\n:::effect[hp]\n::set[seen=true]\n:::'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    expect(await screen.findByText('Visible')).toBeInTheDocument()
    expect(screen.queryByText('set[seen=true]')).toBeNull()
  })

  it('runs directives on mount and when watched keys change', async () => {
    useGameStore.setState({ gameData: { hp: 1 } })
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':::effect[hp]\n::push{key=runs value=1}\n:::'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    await waitFor(() =>
      expect(
        (useGameStore.getState().gameData as Record<string, unknown>).runs
      ).toEqual([1])
    )
    act(() => {
      useGameStore.getState().setGameData({ hp: 2 })
    })
    await waitFor(() =>
      expect(
        (useGameStore.getState().gameData as Record<string, unknown>).runs
      ).toEqual([1, 1])
    )
  })

  it('ignores unsupported directives and logs an error', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':::effect[hp]\n::goto[Two]\n::set[a=1]\n:::'
        }
      ]
    }
    try {
      useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
      render(<Passage />)
      await waitFor(() =>
        expect((useGameStore.getState().gameData as any).a).toBe(1)
      )
      expect(
        useGameStore
          .getState()
          .errors.some(e => e.startsWith('effect only supports directives'))
      ).toBe(true)
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('effect only supports directives')
      )
    } finally {
      errorSpy.mockRestore()
    }
  })
})
