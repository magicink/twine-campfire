import { describe, it, beforeEach, expect } from 'bun:test'
import { render, screen } from '@testing-library/preact'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { resetStores } from '@campfire/test-utils/helpers'

/**
 * Verifies that multiple image directives render each image on a slide.
 */
describe('Passage image directive', () => {
  beforeEach(async () => {
    document.body.innerHTML = ''
    resetStores()
    ;(HTMLElement.prototype as any).animate = () => ({
      finished: Promise.resolve(),
      cancel() {},
      finish() {}
    })
    if (!i18next.isInitialized) {
      await i18next.use(initReactI18next).init({ lng: 'en-US', resources: {} })
    } else {
      await i18next.changeLanguage('en-US')
      i18next.services.resourceStore.data = {}
    }
  })

  it('renders multiple SlideImage components', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: `:::deck{size='1280x720' showNav=false}
  :::slide
    :::reveal{at=0}
      ::image{src='https://placecats.com/bella/1280/360'}

      ::image{src='https://placecats.com/neo/250/250' x=50 y=250 className='rounded-full shadow-lg'}
    :::
  :::
:::`
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const images = await screen.findAllByTestId('slideImage')
    expect(images).toHaveLength(2)
    expect(images[0].querySelector('img')?.getAttribute('src')).toBe(
      'https://placecats.com/bella/1280/360'
    )
    expect(images[1].querySelector('img')?.getAttribute('src')).toBe(
      'https://placecats.com/neo/250/250'
    )
  })
})
