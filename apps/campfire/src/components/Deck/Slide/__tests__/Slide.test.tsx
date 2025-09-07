import { describe, it, expect, beforeEach } from 'bun:test'
import { act, render, screen } from '@testing-library/preact'
import { Deck } from '@campfire/components/Deck'
import { Slide, type SlideProps } from '@campfire/components/Deck/Slide'
import { useDeckStore } from '@campfire/state/useDeckStore'
import type { VNode } from 'preact'
import { StubAnimation } from '@campfire/test-utils/stub-animation'
import { setupResizeObserver } from '@campfire/test-utils/helpers'

/**
 * Resets the deck store to a clean initial state.
 */
const resetStore = () => {
  useDeckStore.getState().reset()
}

beforeEach(() => {
  setupResizeObserver()
  // @ts-expect-error override animate
  HTMLElement.prototype.animate = () => new StubAnimation()
  resetStore()
  document.body.innerHTML = ''
})

describe('Slide', () => {
  it('does not apply default background classes', () => {
    render(
      <Deck>
        <Slide>Slide 1</Slide>
        <Slide>Slide 2</Slide>
      </Deck>
    )
    const el = screen.getByText('Slide 1') as HTMLElement
    expect(el.className).toContain('campfire-slide')
    expect(el).not.toHaveClass('bg-gray-100', 'dark:bg-gray-900')
  })

  it('registers steps in the deck store when active', () => {
    render(
      <Deck>
        <Slide steps={3}>Slide 1</Slide>
      </Deck>
    )
    expect(useDeckStore.getState().maxSteps).toBe(3)
  })

  it('enables vertical scrolling when content overflows', () => {
    render(
      <Deck>
        <Slide>
          <div style={{ height: '2000px' }}>Tall</div>
        </Slide>
      </Deck>
    )
    const el = screen.getByTestId('slide')
    expect(el.className).toContain('overflow-y-auto')
    expect(el.className).toContain('overflow-x-hidden')
  })

  it('exposes transition metadata without applying animations', () => {
    const slide = (
      <Slide transition={{ type: 'fade', duration: 300 }}>Slide 1</Slide>
    ) as VNode<SlideProps>
    render(<Deck>{slide}</Deck>)
    const el = screen.getByText('Slide 1') as HTMLElement
    expect(slide.props.transition).toEqual({
      type: 'fade',
      duration: 300
    })
    expect(el.style.animationName).toBe('')
    expect(el.dataset.transition).toBe(
      JSON.stringify({ type: 'fade', duration: 300 })
    )
  })

  it('resets deck state when the slide unmounts', async () => {
    const { rerender } = render(
      <Deck>
        <Slide steps={2}>Slide 1</Slide>
      </Deck>
    )
    expect(useDeckStore.getState().maxSteps).toBe(2)
    await act(() => {
      rerender(<Deck />)
    })
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    expect(useDeckStore.getState().maxSteps).toBe(2)
  })
})
