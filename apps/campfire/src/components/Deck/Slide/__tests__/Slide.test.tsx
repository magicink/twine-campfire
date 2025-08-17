import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen } from '@testing-library/preact'
import { Deck } from '@campfire/components/Deck'
import { Slide, type SlideProps } from '@campfire/components/Deck/Slide'
import { useDeckStore } from '@campfire/state/useDeckStore'
import type { VNode } from 'preact'
import { StubAnimation } from '@campfire/test-utils/stub-animation'

/**
 * Resets the deck store to a clean initial state.
 */
const resetStore = () => {
  useDeckStore.getState().reset()
}

// Minimal ResizeObserver stub for the tests
class StubResizeObserver {
  observe() {}
  disconnect() {}
}

beforeEach(() => {
  // @ts-expect-error override for tests
  globalThis.ResizeObserver = StubResizeObserver
  // @ts-expect-error override animate
  HTMLElement.prototype.animate = () => new StubAnimation()
  resetStore()
  document.body.innerHTML = ''
})

describe('Slide', () => {
  it('does not apply a default background when none provided', () => {
    render(
      <Deck>
        <Slide>Slide 1</Slide>
        <Slide>Slide 2</Slide>
      </Deck>
    )
    const el = screen.getByText('Slide 1') as HTMLElement
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

  it.skip('resets deck state when the slide unmounts', () => {
    const { rerender } = render(
      <Deck>
        <Slide steps={2}>Slide 1</Slide>
      </Deck>
    )
    expect(useDeckStore.getState().maxSteps).toBe(2)
    rerender(<Deck></Deck>)
    expect(useDeckStore.getState().maxSteps).toBe(0)
  })
})
