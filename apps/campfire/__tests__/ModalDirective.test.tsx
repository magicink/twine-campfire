import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, waitFor, act } from '@testing-library/react'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Element } from 'hast'
import { Passage } from '../src/Passage'
import { useStoryDataStore } from '@/packages/use-story-data-store'
import { useGameStore } from '@/packages/use-game-store'

if (typeof HTMLDialogElement !== 'undefined') {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function () {
      this.open = true
    }
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function () {
      this.open = false
    }
  }
}

const resetStore = () => {
  useStoryDataStore.setState({
    storyData: {},
    passages: [],
    currentPassageId: undefined
  })
  useGameStore.setState({
    gameData: {},
    _initialGameData: {},
    lockedKeys: {},
    onceKeys: {},
    checkpoints: {},
    errors: [],
    loading: false
  })
  localStorage.clear()
  document.title = ''
}

describe('modal directive', () => {
  beforeEach(async () => {
    document.body.innerHTML = ''
    resetStore()
    if (!i18next.isInitialized) {
      await i18next.use(initReactI18next).init({ lng: 'en-US', resources: {} })
    } else {
      await i18next.changeLanguage('en-US')
      i18next.services.resourceStore.data = {}
    }
  })

  it('opens and closes modal via trigger', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::trigger{label="Open"}\n:set[boolean]{show=true}\n:::\n:::modal{open=show}\nInside\n:::trigger{label="Close"}\n:set[boolean]{show=false}\n:::\n:::'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const openBtn = await screen.findByRole('button', { name: 'Open' })
    const dialog = document.querySelector('dialog') as HTMLDialogElement
    expect(dialog.open).toBe(false)
    act(() => {
      openBtn.click()
    })
    await waitFor(() => {
      expect(dialog.open).toBe(true)
    })
    const closeBtn = await screen.findByRole('button', { name: 'Close' })
    act(() => {
      closeBtn.click()
    })
    await waitFor(() => {
      expect(dialog.open).toBe(false)
    })
  })
})
