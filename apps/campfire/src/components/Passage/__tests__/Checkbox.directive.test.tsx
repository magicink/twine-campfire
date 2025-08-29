import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, fireEvent, act } from '@testing-library/preact'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { useGameStore } from '@campfire/state/useGameStore'
import { resetStores } from '@campfire/test-utils/helpers'

/**
 * Tests for Checkbox directive attributes.
 */
describe('Checkbox directive', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    resetStores()
  })

  it('passes style attribute', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':checkbox[agree]{style="color:blue"}\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const button = await screen.findByTestId('checkbox')
    expect((button as HTMLButtonElement).style.color).toBe('blue')
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
            ':::checkbox[agree]\n:::onFocus\n:set[focused=true]\n:::\n:::onHover\n:set[hovered=true]\n:::\n:::\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const button = await screen.findByTestId('checkbox')
    act(() => {
      ;(button as HTMLButtonElement).focus()
    })
    expect(useGameStore.getState().gameData.focused).toBe(true)
    fireEvent.mouseEnter(button)
    expect(useGameStore.getState().gameData.hovered).toBe(true)
  })

  it('removes directive markers for container checkboxes', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':::checkbox[agree]\n:::\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    await screen.findByTestId('checkbox')
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
          value: ':checkbox[agree]{value=true}\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const button = await screen.findByTestId('checkbox')
    expect(button.getAttribute('aria-checked')).toBe('true')
    expect((useGameStore.getState().gameData as any).agree).toBe(true)
  })

  it('uses existing state value when present', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':checkbox[agree]{value=true}\n'
        }
      ]
    }
    useGameStore.setState({ gameData: { agree: false } })
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const button = await screen.findByTestId('checkbox')
    expect(button.getAttribute('aria-checked')).toBe('false')
    expect((useGameStore.getState().gameData as any).agree).toBe(false)
  })

  it('treats input type checkbox as a checkbox directive', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ":input[agree]{type='checkbox'}\n" }]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const button = await screen.findByTestId('checkbox')
    fireEvent.click(button)
    expect((useGameStore.getState().gameData as any).agree).toBe(true)
  })
})
