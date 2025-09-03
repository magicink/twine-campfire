import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, fireEvent, act } from '@testing-library/preact'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { useGameStore } from '@campfire/state/useGameStore'
import { resetStores } from '@campfire/test-utils/helpers'

/**
 * Tests for Input directive attributes.
 */
describe('Input directive', () => {
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
          value: ':input[name]{placeholder="Your name" style="color:blue"}\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const input = await screen.findByPlaceholderText('Your name')
    expect((input as HTMLInputElement).style.color).toBe('blue')
    fireEvent.input(input, { target: { value: 'Jane' } })
    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).name
    ).toBe('Jane')
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
            ':::input[name]\n:::onFocus\n::set[focused=true]\n:::\n:::onMouseEnter\n::set[hovered=true]\n:::\n:::\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const input = await screen.findByTestId('input')
    act(() => {
      ;(input as HTMLInputElement).focus()
    })
    expect(useGameStore.getState().gameData.focused).toBe(true)
    fireEvent.mouseEnter(input)
    expect(useGameStore.getState().gameData.hovered).toBe(true)
  })

  it('removes directive markers for container inputs', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':::input[name]\n:::\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    await screen.findByTestId('input')
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
          value: ':input[name]{value="Sam"}\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const input = await screen.findByTestId('input')
    expect((input as HTMLInputElement).value).toBe('Sam')
    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).name
    ).toBe('Sam')
  })

  it('uses existing state value when present', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':input[name]{value="Sam"}\n'
        }
      ]
    }
    useGameStore.setState({ gameData: { name: 'Existing' } })
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const input = await screen.findByTestId('input')
    expect((input as HTMLInputElement).value).toBe('Existing')
    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).name
    ).toBe('Existing')
  })

  it('retains data on blur after focus', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::input[name]\n:::onFocus\n::set[focused=true]\n:::\n:::onBlur\n::unset[focused]\n:::\n:::\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const input = await screen.findByTestId('input')
    expect(useGameStore.getState().gameData.focused).toBeUndefined()
    act(() => {
      ;(input as HTMLInputElement).focus()
    })
    expect(useGameStore.getState().gameData.focused).toBe(true)
    act(() => {
      input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    })
    expect(useGameStore.getState().gameData.focused).toBeUndefined()
  })
})
