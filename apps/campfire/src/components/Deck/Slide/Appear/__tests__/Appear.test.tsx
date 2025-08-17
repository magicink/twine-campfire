import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, act } from '@testing-library/preact'
import { Deck } from '@campfire/components/Deck'
import { Slide } from '@campfire/components/Deck/Slide'
import { Appear } from '@campfire/components/Deck/Slide'
import { useDeckStore } from '@campfire/state/useDeckStore'
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
  resetStore()
  document.body.innerHTML = ''
})

describe('Appear', () => {
  it('toggles visibility at the configured steps', async () => {
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

  it('unmounts visible elements and does not mount unseen ones on slide change', async () => {
    // @ts-expect-error override animate
    HTMLElement.prototype.animate = () => new StubAnimation()

    render(
      <Deck>
        <Slide>
          <Appear at={0}>First</Appear>
          <Appear at={1}>Second</Appear>
        </Slide>
        <Slide>
          <Appear at={0}>Next</Appear>
        </Slide>
      </Deck>
    )

    expect(screen.getByText('First')).toBeTruthy()
    expect(screen.queryByText('Second')).toBeNull()

    act(() => {
      useDeckStore.getState().goTo(1, 0)
    })

    expect(screen.queryByText('Second')).toBeNull()
    expect(screen.getByText('First')).toBeTruthy()

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(screen.queryByText('First')).toBeNull()
    expect(screen.queryByText('Second')).toBeNull()
  })
})
