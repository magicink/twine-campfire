import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, fireEvent, act } from '@testing-library/preact'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { useGameStore } from '@campfire/state/useGameStore'
import { resetStores } from '@campfire/test-utils/helpers'

/**
 * Tests for Textarea directive attributes.
 */
describe('Textarea directive', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    resetStores()
  })

  it('passes placeholder and style attributes', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':textarea[bio]{placeholder="Your bio" style="color:blue"}\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const textarea = await screen.findByPlaceholderText('Your bio')
    expect((textarea as HTMLTextAreaElement).style.color).toBe('blue')
    fireEvent.input(textarea, { target: { value: 'Hi' } })
    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).bio
    ).toBe('Hi')
  })

  it('runs event directives when used as a container', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::textarea[bio]\n:::onFocus\n::set[focused=true]\n:::\n:::onMouseEnter\n::set[hovered=true]\n:::\n:::\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const textarea = await screen.findByTestId('textarea')
    act(() => {
      ;(textarea as HTMLTextAreaElement).focus()
    })
    expect(useGameStore.getState().gameData.focused).toBe(true)
    fireEvent.mouseEnter(textarea)
    expect(useGameStore.getState().gameData.hovered).toBe(true)
  })

  it('removes directive markers for container textareas', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':::textarea[bio]\n:::\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    await screen.findByTestId('textarea')
    expect(document.body.textContent).not.toContain(':::')
  })

  it('initializes state from value attribute', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':textarea[bio]{value="Hello"}\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const textarea = await screen.findByTestId('textarea')
    expect((textarea as HTMLTextAreaElement).value).toBe('Hello')
    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).bio
    ).toBe('Hello')
  })

  it('uses existing state value when present', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':textarea[bio]{value="Hello"}\n'
        }
      ]
    }
    useGameStore.setState({ gameData: { bio: 'Existing' } })
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const textarea = await screen.findByTestId('textarea')
    expect((textarea as HTMLTextAreaElement).value).toBe('Existing')
    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).bio
    ).toBe('Existing')
  })
})
