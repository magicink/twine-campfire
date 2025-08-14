import { describe, it, beforeEach, expect } from 'bun:test'
import { render, waitFor } from '@testing-library/preact'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useStoryDataStore } from '@campfire/use-story-data-store'
import { useGameStore } from '@campfire/use-game-store'
import { resetStores } from '@campfire/test-utils/helpers'

/**
 * Creates a passage that sets `hp` inside an if directive using the provided indentation.
 */
const makePassage = (indent: string): Element => ({
  type: 'element',
  tagName: 'tw-passagedata',
  properties: { pid: '1', name: 'Start' },
  children: [{ type: 'text', value: `:::if[true]\n${indent}:set[hp=5]\n:::` }]
})

describe('directive indentation', () => {
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

  const cases: [string, string][] = [
    ['two spaces', '  '],
    ['four spaces', '    '],
    ['tab', '\t']
  ]

  for (const [label, indent] of cases) {
    it(`processes directives with ${label}`, async () => {
      const passage = makePassage(indent)
      useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
      render(<Passage />)
      await waitFor(() =>
        expect((useGameStore.getState().gameData as any).hp).toBe(5)
      )
    })
  }
})
