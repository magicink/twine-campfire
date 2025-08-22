import { describe, it, beforeEach, expect } from 'bun:test'
import { render, screen } from '@testing-library/preact'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { resetStores } from '@campfire/test-utils/helpers'

/**
 * Verifies that the layer directive renders the Layer component in a Passage.
 */
describe('Passage layer directive', () => {
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

  it('renders a Layer component', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':::layer{x=10}\nContent\n:::' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)

    const el = await screen.findByTestId('layer')
    expect(el.tagName).toBe('DIV')
    expect(el.textContent).toContain('Content')
  })
})
