import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, waitFor, act } from '@testing-library/react'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Element } from 'hast'
import { Passage } from '../src/Passage'
import { useStoryDataStore } from '@/packages/use-story-data-store'
import { useGameStore } from '@/packages/use-game-store'
import { resetStores } from './helpers'

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
            ':::trigger{label="Fire" class="extra"}\n:::set{key=fired value=true}\n:::\n:::'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const button = await screen.findByRole('button', { name: 'Fire' })
    expect(button.className).toContain('campfire-trigger')
    expect(button.className).toContain('extra')
    act(() => {
      button.click()
    })
    await waitFor(() => {
      expect(useGameStore.getState().gameData.fired).toBe('true')
    })
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
            ':::trigger{label="Stop" disabled}\n:::set{key=stopped value=true}\n:::\n:::'
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
            ':::trigger{label="Go" disabled=false}\n:::set{key=go value=true}\n:::\n:::'
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
      expect(useGameStore.getState().gameData.go).toBe('true')
    })
  })
})
