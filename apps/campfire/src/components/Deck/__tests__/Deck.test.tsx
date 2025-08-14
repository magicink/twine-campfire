import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, fireEvent, act } from '@testing-library/preact'
import { Deck } from '@campfire/components/Deck/Deck'
import { useDeckStore } from '@campfire/state/useDeckStore'

/**
 * Resets the deck store to a clean initial state.
 */
const resetStore = () => {
  useDeckStore.setState({
    currentSlide: 0,
    currentStep: 0,
    maxSteps: 0,
    slidesCount: 0,
    stepsPerSlide: {}
  })
}

// Minimal ResizeObserver stub for the tests
class StubResizeObserver {
  observe() {}
  disconnect() {}
}

beforeEach(() => {
  // @ts-expect-error override for tests
  globalThis.ResizeObserver = StubResizeObserver
  resetStore()
  document.body.innerHTML = ''
})

describe('Deck', () => {
  it('sets slide count and renders the current slide', () => {
    render(
      <Deck>
        <div>Slide 1</div>
        <div>Slide 2</div>
      </Deck>
    )
    expect(useDeckStore.getState().slidesCount).toBe(2)
    expect(screen.getByText('Slide 1')).toBeInTheDocument()
  })

  it('uses gray backgrounds for light and dark modes', () => {
    const { container } = render(
      <Deck>
        <div>Slide 1</div>
      </Deck>
    )
    expect(container.firstChild).toHaveClass('bg-gray-100', 'dark:bg-gray-900')
  })

  it('advances and reverses slides via click and keyboard', () => {
    render(
      <Deck>
        <div>Slide 1</div>
        <div>Slide 2</div>
      </Deck>
    )
    const inner = screen.getByText('Slide 1').parentElement as HTMLElement
    act(() => {
      fireEvent.click(inner)
    })
    expect(useDeckStore.getState().currentSlide).toBe(1)
    expect(screen.getByText('Slide 2')).toBeInTheDocument()
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    })
    expect(useDeckStore.getState().currentSlide).toBe(0)
  })

  it('jumps to start or end using Home and End keys', () => {
    render(
      <Deck>
        <div>Slide 1</div>
        <div>Slide 2</div>
        <div>Slide 3</div>
      </Deck>
    )
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }))
    })
    expect(useDeckStore.getState().currentSlide).toBe(2)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }))
    })
    expect(useDeckStore.getState().currentSlide).toBe(0)
  })
})
