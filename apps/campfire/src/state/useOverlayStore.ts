import { create } from 'zustand'
import type { ComponentChild } from 'preact'

export interface OverlayItem {
  /** Unique name for the overlay passage */
  name: string
  /** Renderable component generated from overlay content */
  component: ComponentChild
  /** Whether the overlay is currently visible */
  visible: boolean
  /** Stacking order; higher values render above lower ones */
  zIndex: number
  /** Optional grouping tag for bulk toggling */
  group?: string
}

export interface OverlayState {
  /** List of processed overlay components */
  overlays: OverlayItem[]
  /** Replace the current list of overlays */
  setOverlays: (items: OverlayItem[]) => void
  /** Show the overlay with the given name */
  showOverlay: (name: string) => void
  /** Hide the overlay with the given name */
  hideOverlay: (name: string) => void
  /** Toggle the visibility of the overlay with the given name */
  toggleOverlay: (name: string) => void
  /** Toggle all overlays within a group */
  toggleGroup: (group: string) => void
}

/**
 * Global store holding processed overlay components.
 */
export const useOverlayStore = create<OverlayState>(set => ({
  overlays: [],
  setOverlays: items => set({ overlays: items }),
  showOverlay: name =>
    set(state => ({
      overlays: state.overlays.map(o =>
        o.name === name ? { ...o, visible: true } : o
      )
    })),
  hideOverlay: name =>
    set(state => ({
      overlays: state.overlays.map(o =>
        o.name === name ? { ...o, visible: false } : o
      )
    })),
  toggleOverlay: name =>
    set(state => ({
      overlays: state.overlays.map(o =>
        o.name === name ? { ...o, visible: !o.visible } : o
      )
    })),
  toggleGroup: group =>
    set(state => ({
      overlays: state.overlays.map(o =>
        o.group === group ? { ...o, visible: !o.visible } : o
      )
    }))
}))
