import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, act } from '@testing-library/preact'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { useDeckStore } from '@campfire/state/useDeckStore'
import { resetStores } from '@campfire/test-utils/helpers'
import { StubAnimation } from '@campfire/test-utils/stub-animation'

describe('Passage deck state', () => {
  beforeEach(async () => {
    document.body.innerHTML = ''
    resetStores()
    HTMLElement.prototype.animate = () =>
      new StubAnimation() as unknown as Animation
    if (!i18next.isInitialized) {
      await i18next.use(initReactI18next).init({ lng: 'en-US', resources: {} })
    } else {
      await i18next.changeLanguage('en-US')
      i18next.services.resourceStore.data = {}
    }
  })

  it('resets deck step when navigating between passages', async () => {
    const passage1: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: `:::deck{size='400x300'}\n:::slide\n:::reveal{at=0}\nFirst deck 1\n:::\n:::reveal{at=1}\nFirst deck 2\n:::\n:::\n:::\n`
        }
      ]
    }
    const passage2: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Second' },
      children: [
        {
          type: 'text',
          value: `:::deck{size='400x300'}\n:::slide\n:::reveal{at=0}\nSecond deck 1\n:::\n:::reveal{at=1}\nSecond deck 2\n:::\n:::\n:::\n`
        }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage1, passage2],
      currentPassageId: '1'
    })

    const { rerender } = render(<Passage />)

    await screen.findByText('First deck 1')
    act(() => {
      useDeckStore.getState().next()
    })
    await screen.findByText('First deck 2')

    act(() => {
      useStoryDataStore.setState({ currentPassageId: '2' })
    })
    rerender(<Passage />)

    await screen.findByText('Second deck 1')
    expect(screen.queryByText('Second deck 2')).toBeNull()
  })
})
