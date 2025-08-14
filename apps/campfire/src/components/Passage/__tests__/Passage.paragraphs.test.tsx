import { describe, it, beforeEach, expect } from 'bun:test'
import { render, screen } from '@testing-library/preact'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useStoryDataStore } from '@campfire/use-story-data-store'
import { resetStores } from '@campfire/test-utils/helpers'

describe('Passage paragraph styles', () => {
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

  it('applies default font family and size classes to paragraphs', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: 'First paragraph\n\nSecond paragraph' }]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const paragraphs = await screen.findAllByText(/paragraph/)
    expect(paragraphs).toHaveLength(2)
    paragraphs.forEach(p => {
      expect(p.className).toContain('font-libertinus')
      expect(p.className).toContain('text-base')
    })
  })
})
