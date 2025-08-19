import { describe, it, beforeEach, expect } from 'bun:test'
import { render, screen } from '@testing-library/preact'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { resetStores } from '@campfire/test-utils/helpers'

/**
 * Tests rendering of the shape directive within a Passage.
 */
describe('Passage shape directive', () => {
  beforeEach(async () => {
    document.body.innerHTML = ''
    resetStores()
    const animation: Partial<Animation> = {
      finished: Promise.resolve<Animation>({} as Animation),
      cancel() {}
    }
    Object.defineProperty(HTMLElement.prototype, 'animate', {
      value: () => animation as Animation
    })
    if (!i18next.isInitialized) {
      await i18next.use(initReactI18next).init({ lng: 'en-US', resources: {} })
    } else {
      await i18next.changeLanguage('en-US')
      i18next.services.resourceStore.data = {}
    }
  })

  it('renders SlideShape components without stray markers', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::deck{size=800x600}\n:::slide\n:shape{x=10 y=20 w=100 h=50 type="rect" data-test="ok"}\n:::\n:::\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const el = await screen.findByTestId('slideShape')
    expect(el).toBeTruthy()
    expect(el.style.left).toBe('10px')
    expect(el.style.top).toBe('20px')
    expect(el.style.width).toBe('100px')
    expect(el.style.height).toBe('50px')
    expect(el.getAttribute('data-test')).toBe('ok')
    expect(document.body.innerHTML).not.toContain('<SlideShape')
    expect(document.body.textContent).not.toContain(':::')
  })
})
