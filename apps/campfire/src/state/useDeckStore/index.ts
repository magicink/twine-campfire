import { create } from 'zustand'
import {
  createDeckStore,
  type DeckState
} from '@campfire/state/createDeckStore'

/**
 * Zustand store for tracking slide and step navigation.
 */
export const useDeckStore = create<DeckState>(createDeckStore())

export type { DeckState }
