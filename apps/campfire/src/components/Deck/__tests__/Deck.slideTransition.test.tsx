/** @jsxImportSource preact */
import { test, expect, beforeEach } from 'bun:test'
import { render, act } from '@testing-library/preact'
import { Deck } from '@campfire/components/Deck'
import { Slide } from '@campfire/components/Deck/Slide'
import { useDeckStore } from '@campfire/state/useDeckStore'
import { StubAnimation } from '@campfire/test-utils/stub-animation'

/**
 * Resets the deck store to a clean initial state.
 */
const resetStore = (): void => {
  useDeckStore.getState().reset()
}

/** Minimal ResizeObserver stub for the tests. */
class StubResizeObserver {
  observe(): void {}
  disconnect(): void {}
}

beforeEach(() => {
  ;(globalThis as any).ResizeObserver = StubResizeObserver
  resetStore()
  document.body.innerHTML = ''
  const animateStub: typeof HTMLElement.prototype.animate = () =>
    new StubAnimation() as unknown as Animation
  HTMLElement.prototype.animate = animateStub
})

test('advances without extra interaction for slides without steps', async () => {
  const { unmount } = render(
    <Deck>
      <Slide steps={1}>One</Slide>
      <Slide transition={{ type: 'slide' }}>Two</Slide>
      <Slide>Three</Slide>
    </Deck>
  )
  await act(async () => {
    useDeckStore.getState().next()
  })
  await act(async () => {
    useDeckStore.getState().next()
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  await act(async () => {
    useDeckStore.getState().next()
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  expect(useDeckStore.getState().currentSlide).toBe(2)
  unmount()
})
