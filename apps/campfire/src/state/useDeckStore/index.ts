import { create } from 'zustand'
import {
  createDeckStore,
  type DeckState
} from '@campfire/state/createDeckStore'
import { createSelectors } from '@campfire/state/utils'

/**
 * Zustand store for tracking slide and step navigation.
 */
const useDeckStoreBase = create<DeckState>(createDeckStore())

/** Global deck store with selector helpers. */
export const useDeckStore = createSelectors(useDeckStoreBase)

export type { DeckState }
