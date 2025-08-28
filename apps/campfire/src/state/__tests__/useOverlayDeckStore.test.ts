import { describe, it, expect, beforeEach } from 'bun:test'
import { useOverlayDeckStore } from '../useOverlayDeckStore'
import { useDeckStore } from '../useDeckStore'

beforeEach(() => {
  useOverlayDeckStore.getState().reset()
  useDeckStore.getState().reset()
})

describe('useOverlayDeckStore', () => {
  it('maintains state when main deck resets', () => {
    useOverlayDeckStore.setState({ currentSlide: 1 })
    useDeckStore.getState().reset()
    expect(useOverlayDeckStore.getState().currentSlide).toBe(1)
  })
})
