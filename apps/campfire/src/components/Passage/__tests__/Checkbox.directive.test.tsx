import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, fireEvent, act } from '@testing-library/preact'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { useGameStore } from '@campfire/state/useGameStore'
import { resetStores } from '@campfire/test-utils/helpers'
import { expectContainerDirectiveBehavior } from '@campfire/test-utils/formFieldTests'

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
    await expectContainerDirectiveBehavior({
      directiveName: 'checkbox',
      directiveConfig: '[agree]',
      testId: 'checkbox'
    })
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
