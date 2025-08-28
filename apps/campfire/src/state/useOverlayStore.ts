import { create } from 'zustand'
import type { ComponentChild } from 'preact'
import { setImmer } from '@campfire/state/utils'

export interface OverlayItem {
  /** Unique name for the overlay passage */
  name: string
  /** Renderable component generated from overlay content */
  component: ComponentChild
}

export interface OverlayState {
  /** List of processed overlay components */
  overlays: OverlayItem[]
  /** Replace the current list of overlays */
  setOverlays: (items: OverlayItem[]) => void
}

/**
 * Global store holding processed overlay components.
 */
export const useOverlayStore = create<OverlayState>(set => {
  const immer = setImmer<OverlayState>(set)
  return {
    overlays: [],
    setOverlays: items =>
      immer(state => {
        state.overlays = items
      })
  }
})
