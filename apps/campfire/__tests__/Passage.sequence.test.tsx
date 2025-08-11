import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, act } from '@testing-library/preact'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Element } from 'hast'
import { Passage } from '../src/Passage'
import { useStoryDataStore } from '@/packages/use-story-data-store'
import { useGameStore } from '@/packages/use-game-store'
import { resetStores } from './helpers'

describe('Passage sequence directive', () => {
  beforeEach(async () => {
    document.body.innerHTML = ''
    resetStores()
    if (!i18next.isInitialized) {
      await i18next.use(initReactI18next).init({
        lng: 'en-US',
        resources: {}
      })
    } else {
      await i18next.changeLanguage('en-US')
      i18next.services.resourceStore.data = {}
    }
  })

  it('renders sequence steps and runs onComplete content', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::sequence\n:::step\nFirst\n:::\n:::step\nSecond\n:::\n:::onComplete\n:set[done=true]\n:::\n:::\n'
        }
      ]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)

    expect(await screen.findByText('First')).toBeInTheDocument()
    expect(await screen.findByText('Second')).toBeInTheDocument()
  })

  it('handles nested directives within indented steps', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::sequence\n    :::step\n        :::transition\n        Hello\n        :::\n    :::\n    :::step\n        :::transition\n        How are you?\n        :::\n    :::\n:::\n'
        }
      ]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)

    expect(await screen.findByText('Hello')).toBeInTheDocument()
    expect(await screen.findByText('How are you?')).toBeInTheDocument()
    expect(screen.queryByText(':::transition')).toBeNull()
  })
})
