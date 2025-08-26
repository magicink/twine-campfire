import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, fireEvent, act } from '@testing-library/preact'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { useGameStore } from '@campfire/state/useGameStore'
import { resetStores } from '@campfire/test-utils/helpers'

/**
 * Tests for Select directive attributes.
 */
describe('Select directive', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    resetStores()
  })

  it('passes className and style attributes', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::select[color]{className="extra" style="color:blue"}\n:option{value="red" label="Red"}\n:option{value="blue" label="Blue"}\n:::\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const select = await screen.findByTestId('select')
    expect((select as HTMLSelectElement).style.color).toBe('blue')
    expect(select.className.split(' ')).toContain('extra')
    fireEvent.input(select, { target: { value: 'blue' } })
    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).color
    ).toBe('blue')
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
            ':::select[color]\n:option{value="red" label="Red"}\n:option{value="blue" label="Blue"}\n:::onFocus\n:set[focused=true]\n:::\n:::onHover\n:set[hovered=true]\n:::\n:::\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const select = await screen.findByTestId('select')
    act(() => {
      ;(select as HTMLSelectElement).focus()
    })
    expect(useGameStore.getState().gameData.focused).toBe(true)
    fireEvent.mouseEnter(select)
    expect(useGameStore.getState().gameData.hovered).toBe(true)
  })

  it('removes directive markers for container selects', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':::select[color]\n:option{value="red" label="Red"}\n:::\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    await screen.findByTestId('select')
    expect(document.body.textContent).not.toContain(':::')
  })
})
