import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, waitFor, act } from '@testing-library/react'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Element } from 'hast'
import { Passage } from '../src/Passage'
import { useStoryDataStore } from '@/packages/use-story-data-store'
import { useGameStore } from '@/packages/use-game-store'
import { resetStores } from './helpers'

describe('Passage lifecycle directives', () => {
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

  it('executes once blocks only once', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':::once{intro}\nHello\n:::' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    const { rerender } = render(<Passage />)

    const text = await screen.findByText('Hello')
    expect(text).toBeInTheDocument()

    act(() => {
      useStoryDataStore.setState({ currentPassageId: undefined })
    })
    rerender(<Passage />)

    act(() => {
      useStoryDataStore.setState({ currentPassageId: '1' })
    })
    rerender(<Passage />)
    await waitFor(() => {
      expect(screen.queryByText('Hello')).toBeNull()
    })
  })
})
