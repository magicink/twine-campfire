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

  it('displays label when no option is selected', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::select[color]{label="Choose"}\n:option{value="red" label="Red"}\n:::\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const select = await screen.findByTestId('select')
    expect(select.textContent).toBe('Choose')
  })

  it('displays label when no options are available', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':::select[color]{label="Choose"}\n:::\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const select = await screen.findByTestId('select')
    expect(select.textContent).toBe('Choose')
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
    expect((select as HTMLButtonElement).style.color).toBe('blue')
    expect(select.className.split(' ')).toContain('extra')
    fireEvent.click(select)
    await new Promise(r => setTimeout(r, 0))
    fireEvent.click(screen.getAllByTestId('option')[1])
    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).color
    ).toBe('blue')
  })

  it('runs event directives only on interaction', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::select[color]\n:option{value="red" label="Red"}\n:option{value="blue" label="Blue"}\n:::onFocus\n::set[focused=true]\n:::\n:::onBlur\n::set[blurred=true]\n:::\n:::onMouseEnter\n::set[hovered=true]\n:::\n:::\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const select = await screen.findByTestId('select')
    expect(useGameStore.getState().gameData.focused).toBeUndefined()
    act(() => {
      ;(select as HTMLButtonElement).focus()
    })
    expect(useGameStore.getState().gameData.focused).toBe(true)
    act(() => {
      ;(select as HTMLButtonElement).blur()
    })
    expect(useGameStore.getState().gameData.blurred).toBe(true)
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

  it('initializes state from value attribute', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::select[color]{value="blue"}\n:option{value="red" label="Red"}\n:option{value="blue" label="Blue"}\n:::\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const select = await screen.findByTestId('select')
    expect((select as HTMLButtonElement).value).toBe('blue')
    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).color
    ).toBe('blue')
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
            ':::select[color]{value="blue"}\n:option{value="red" label="Red"}\n:option{value="blue" label="Blue"}\n:::\n'
        }
      ]
    }
    useGameStore.setState({ gameData: { color: 'red' } })
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const select = await screen.findByTestId('select')
    expect((select as HTMLButtonElement).value).toBe('red')
    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).color
    ).toBe('red')
  })

  it('clears state on blur after focus', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::select[color]\n:option{value="red" label="Red"}\n:::onFocus\n::set[focused=true]\n:::\n:::onBlur\n::unset[focused]\n:::\n:::\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const select = await screen.findByTestId('select')
    expect(useGameStore.getState().gameData.focused).toBeUndefined()
    act(() => {
      ;(select as HTMLButtonElement).focus()
    })
    expect(useGameStore.getState().gameData.focused).toBe(true)
    act(() => {
      select.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    })
    expect(useGameStore.getState().gameData.focused).toBeUndefined()
  })
})
