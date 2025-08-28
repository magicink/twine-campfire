import { describe, it, expect, beforeEach } from 'bun:test'
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent
} from '@testing-library/preact'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { useGameStore } from '@campfire/state/useGameStore'
import { resetStores } from '@campfire/test-utils/helpers'

describe('Passage trigger directives', () => {
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

  it('executes trigger directives on button click', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::trigger{label="Fire" className="extra"}\n:::set[fired=true]\n:::\n:::'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const button = await screen.findByRole('button', { name: 'Fire' })
    expect(button.className).toContain('campfire-trigger')
    expect(button.className).toContain('extra')
    expect(button.className).toContain('font-libertinus')
    act(() => {
      button.click()
    })
    await waitFor(() => {
      expect(useGameStore.getState().gameData.fired).toBe(true)
    })
  })

  it('passes style attribute to the component', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':::trigger{label="Styled" style="color:blue"}\n:::'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const button = await screen.findByRole('button', { name: 'Styled' })
    expect((button as HTMLButtonElement).style.color).toBe('blue')
  })

  it('does not run directives when trigger is disabled', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::trigger{label="Stop" disabled}\n:::set[stopped=true]\n:::\n:::'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const button = await screen.findByRole('button', { name: 'Stop' })
    expect(button).toBeDisabled()
    act(() => {
      button.click()
    })
    await waitFor(() => {
      expect(useGameStore.getState().gameData.stopped).toBeUndefined()
    })
  })

  it('respects disabled=false attribute', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::trigger{label="Go" disabled=false}\n:::set[go=true]\n:::\n:::'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const button = await screen.findByRole('button', { name: 'Go' })
    expect(button).not.toBeDisabled()
    act(() => {
      button.click()
    })
    await waitFor(() => {
      expect(useGameStore.getState().gameData.go).toBe(true)
    })
  })

  it('ignores unquoted label attributes', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':::trigger{label=Fire}\n:::set[fired=true]\n:::\n:::'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const button = await screen.findByRole('button')
    expect(screen.queryByRole('button', { name: 'Fire' })).toBeNull()
    expect(button.textContent).toBe('')
  })

  it('runs event directives for trigger blocks', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::trigger{label="Do"}\n:::onHover\n:set[hovered=true]\n:::\n:::onFocus\n:set[focused=true]\n:::\n:::onBlur\n:set[blurred=true]\n:::\n:set[clicked=true]\n:::\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const button = await screen.findByRole('button', { name: 'Do' })
    fireEvent.mouseEnter(button)
    expect(useGameStore.getState().gameData.hovered).toBe(true)
    fireEvent.focus(button)
    expect(useGameStore.getState().gameData.focused).toBe(true)
    fireEvent.blur(button)
    expect(useGameStore.getState().gameData.blurred).toBe(true)
    act(() => {
      button.click()
    })
    await waitFor(() => {
      expect(useGameStore.getState().gameData.clicked).toBe(true)
    })
  })

  it('removes directive markers after trigger blocks', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':::trigger{label="Fire"}\n:::set[fired=true]\n:::\n:::'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    await screen.findByRole('button', { name: 'Fire' })
    expect(document.body.textContent).not.toContain(':::')
  })

  it('stops click propagation', async () => {
    let clicked = false
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':::trigger{label="Fire"}\n:::' }]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(
      <div
        onClick={() => {
          clicked = true
        }}
      >
        <Passage />
      </div>
    )
    const button = await screen.findByRole('button', { name: 'Fire' })
    fireEvent.click(button)
    expect(clicked).toBe(false)
  })
})
