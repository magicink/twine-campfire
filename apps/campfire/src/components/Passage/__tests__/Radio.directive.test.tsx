import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, fireEvent, act } from '@testing-library/preact'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { useGameStore } from '@campfire/state/useGameStore'
import { resetStores } from '@campfire/test-utils/helpers'

/**
 * Tests for Radio directive attributes.
 */
describe('Radio directive', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    resetStores()
  })

  it('does not wrap radios in paragraphs', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':radio[choice]{value="a"}\n' }]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    await screen.findByTestId('radio')
    expect(document.querySelector('p')).toBeNull()
  })

  it('passes style attribute', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':radio[choice]{value="a" style="color:blue"}\n:radio[choice]{value="b"}\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const buttons = await screen.findAllByTestId('radio')
    expect((buttons[0] as HTMLButtonElement).style.color).toBe('blue')
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
            ':::radio[choice]{value="a"}\n:::onFocus\n::set[focused=true]\n:::\n:::onMouseEnter\n::set[hovered=true]\n:::\n:::\n:radio[choice]{value="b"}\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const buttons = await screen.findAllByTestId('radio')
    act(() => {
      ;(buttons[0] as HTMLButtonElement).focus()
    })
    expect(useGameStore.getState().gameData.focused).toBe(true)
    fireEvent.mouseEnter(buttons[0])
    expect(useGameStore.getState().gameData.hovered).toBe(true)
  })

  it('removes directive markers for container radios', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':::radio[choice]{value="a"}\n:::\n:radio[choice]{value="b"}\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    await screen.findAllByTestId('radio')
    expect(document.body.textContent).not.toContain(':::')
  })

  it('initializes state from checked attribute', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':radio[choice]{value="a" checked}\n:radio[choice]{value="b"}\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const buttons = await screen.findAllByTestId('radio')
    expect(buttons[0].getAttribute('aria-checked')).toBe('true')
    expect((useGameStore.getState().gameData as any).choice).toBe('a')
  })

  it('uses existing state value when present', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':radio[choice]{value="a" checked}\n:radio[choice]{value="b"}\n'
        }
      ]
    }
    useGameStore.setState({ gameData: { choice: 'b' } })
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const buttons = await screen.findAllByTestId('radio')
    expect(buttons[0].getAttribute('aria-checked')).toBe('false')
    expect((useGameStore.getState().gameData as any).choice).toBe('b')
  })

  it('treats input type radio as a radio directive', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ":input[choice]{type='radio' value='a'}\n:input[choice]{type='radio' value='b' checked}\n"
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const buttons = await screen.findAllByTestId('radio')
    expect(buttons[1].getAttribute('aria-checked')).toBe('true')
    expect((useGameStore.getState().gameData as any).choice).toBe('b')
  })
})
