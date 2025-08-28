import { describe, it, expect, beforeEach } from 'bun:test'
import { useOverlayStore } from '../useOverlayStore'
import type { ComponentChild } from 'preact'

beforeEach(() => {
  useOverlayStore.setState({ overlays: [] })
})

describe('useOverlayStore', () => {
  it('stores overlay components', () => {
    const sample: ComponentChild = 'overlay'
    useOverlayStore
      .getState()
      .setOverlays([
        { name: 'o1', component: sample, visible: true, zIndex: 0 }
      ])
    const state = useOverlayStore.getState()
    expect(state.overlays.length).toBe(1)
    expect(state.overlays[0].name).toBe('o1')
  })

  it('toggles overlay visibility', () => {
    const sample: ComponentChild = 'overlay'
    useOverlayStore
      .getState()
      .setOverlays([
        { name: 'o1', component: sample, visible: true, zIndex: 0 }
      ])
    useOverlayStore.getState().toggleOverlay('o1')
    expect(useOverlayStore.getState().overlays[0].visible).toBe(false)
    useOverlayStore.getState().toggleOverlay('o1')
    expect(useOverlayStore.getState().overlays[0].visible).toBe(true)
  })

  it('toggles overlay groups', () => {
    const sample: ComponentChild = 'overlay'
    useOverlayStore.getState().setOverlays([
      { name: 'o1', component: sample, visible: true, zIndex: 0, group: 'g' },
      { name: 'o2', component: sample, visible: true, zIndex: 0, group: 'g' }
    ])
    useOverlayStore.getState().toggleGroup('g')
    const [a, b] = useOverlayStore.getState().overlays
    expect(a.visible).toBe(false)
    expect(b.visible).toBe(false)
  })
})
