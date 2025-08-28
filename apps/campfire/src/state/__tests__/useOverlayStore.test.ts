import { describe, it, expect, beforeEach } from 'bun:test'
import { useOverlayStore } from '../useOverlayStore'
import type { ComponentChild } from 'preact'

beforeEach(() => {
  useOverlayStore.setState({ overlays: [] })
})

describe('useOverlayStore', () => {
  it('stores overlay components', () => {
    const sample: ComponentChild = 'overlay'
    useOverlayStore.getState().setOverlays([{ name: 'o1', component: sample }])
    const state = useOverlayStore.getState()
    expect(state.overlays.length).toBe(1)
    expect(state.overlays[0].name).toBe('o1')
  })
})
