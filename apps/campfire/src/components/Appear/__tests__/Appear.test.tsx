import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, act } from '@testing-library/preact'
import { Deck } from '@campfire/components/Deck/Deck'
import { Slide } from '@campfire/components/Slide/Slide'
import { Appear } from '@campfire/components/Appear/Appear'
import { useDeckStore } from '@campfire/use-deck-store'

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

describe('Appear', () => {
  it('toggles visibility at the configured steps', async () => {
    class StubAnimation {
      finished: Promise<void>
      private resolve!: () => void
      constructor() {
        this.finished = new Promise<void>(res => {
          this.resolve = res
        })
        setTimeout(() => this.finish(), 0)
      }
      cancel() {
        this.resolve()
      }
      finish() {
        this.resolve()
      }
    }
    // @ts-expect-error override animate
    HTMLElement.prototype.animate = () => new StubAnimation()

    render(
      <Deck>
        <Slide>
          <Appear at={1}>Hello</Appear>
        </Slide>
      </Deck>
    )
    expect(screen.queryByText('Hello')).toBeNull()
    act(() => {
      useDeckStore.getState().next()
    })
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    expect(screen.getByText('Hello')).toBeTruthy()
  })

  it('runs exit animation and unmounts after completion', async () => {
    class StubAnimation {
      finished: Promise<void>
      private resolve!: () => void
      constructor() {
        this.finished = new Promise<void>(res => {
          this.resolve = res
        })
        setTimeout(() => this.finish(), 0)
      }
      cancel() {
        this.resolve()
      }
      finish() {
        this.resolve()
      }
    }
    // @ts-expect-error override animate
    HTMLElement.prototype.animate = () => new StubAnimation()

    render(
      <Deck>
        <Slide>
          <Appear exitAt={1}>Bye</Appear>
        </Slide>
      </Deck>
    )
    expect(screen.getByText('Bye')).toBeTruthy()
    act(() => {
      useDeckStore.getState().next()
    })
    // Still mounted during animation
    expect(screen.getByText('Bye')).toBeTruthy()
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    expect(screen.queryByText('Bye')).toBeNull()
  })

  it('shows final state immediately when jumping past appear step', async () => {
    render(
      <Deck>
        <Slide>
          <Appear at={2}>Skip</Appear>
        </Slide>
      </Deck>
    )
    act(() => {
      useDeckStore.getState().goTo(0, 5)
    })
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    expect(screen.getByText('Skip')).toBeTruthy()
  })
})
