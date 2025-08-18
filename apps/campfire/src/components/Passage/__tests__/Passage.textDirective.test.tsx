import { describe, it, beforeEach, expect } from 'bun:test'
import { render, screen } from '@testing-library/preact'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { useGameStore } from '@campfire/state/useGameStore'
import { resetStores } from '@campfire/test-utils/helpers'

describe('Passage text directive', () => {
  beforeEach(async () => {
    document.body.innerHTML = ''
    resetStores()
    ;(HTMLElement.prototype as any).animate = () => ({
      finished: Promise.resolve(),
      cancel() {}
    })
    if (!i18next.isInitialized) {
      await i18next.use(initReactI18next).init({ lng: 'en-US', resources: {} })
    } else {
      await i18next.changeLanguage('en-US')
      i18next.services.resourceStore.data = {}
    }
  })

  it('renders SlideText components without stray markers', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::deck{size=800x600}\n:::slide\n:::text{x=80 y=80 as="h2"}\nHello\n:::\n:::\n:::\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const el = await screen.findByTestId('slideText')
    expect(el).toBeTruthy()
    expect(document.body.innerHTML).not.toContain('<SlideText')
    expect(document.body.textContent).not.toContain(':::')
  })

  it('renders show directive inside text container', async () => {
    useGameStore.setState({ gameData: { hp: 5 } })
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::deck{size=800x600}\n:::slide\n:::text{x=80 y=80}\nHP: :show[hp]\n:::\n:::\n:::\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const el = await screen.findByTestId('slideText')
    const text = el.textContent?.replace(/\s+/g, ' ').trim()
    expect(text).toBe('HP: 5')
  })

  it('renders t directive inside text container', async () => {
    i18next.addResource('en-US', 'translation', 'hello', 'Hello')
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::deck{size=800x600}\n:::slide\n:::text{x=80 y=80}\n:t[hello]\n:::\n:::\n:::\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const el = await screen.findByText('Hello')
    expect(el).toBeInTheDocument()
  })
})
