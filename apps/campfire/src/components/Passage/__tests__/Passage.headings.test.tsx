import { describe, it, beforeEach, expect } from 'bun:test'
import { render, screen } from '@testing-library/preact'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useStoryDataStore } from '@/packages/use-story-data-store'
import { resetStores } from '@campfire/test-utils/helpers'

describe('Passage heading styles', () => {
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

  it('applies default font family, size, and weight classes to headings', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: '# Title\n## Subtitle\n### Section' }]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const h1 = await screen.findByRole('heading', { level: 1 })
    const h2 = screen.getByRole('heading', { level: 2 })
    const h3 = screen.getByRole('heading', { level: 3 })
    expect(h1.className).toContain('font-libertinus')
    expect(h1.className).toContain('text-4xl')
    expect(h1.className).toContain('font-bold')
    expect(h2.className).toContain('font-libertinus')
    expect(h2.className).toContain('text-3xl')
    expect(h2.className).toContain('font-semibold')
    expect(h3.className).toContain('font-libertinus')
    expect(h3.className).toContain('text-2xl')
    expect(h3.className).toContain('font-medium')
  })
})
