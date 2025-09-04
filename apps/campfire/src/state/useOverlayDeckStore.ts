import { create } from 'zustand'
import {
  createDeckStore,
  type DeckState
} from '@campfire/state/createDeckStore'
import { createSelectors } from '@campfire/state/utils'

/**
 * Zustand store for overlay decks to keep their navigation state persistent
 * across passage changes.
 */
const useOverlayDeckStoreBase = create<DeckState>(
  createDeckStore({ persistent: true })
)

/** Overlay deck store with selector hooks. */
export const useOverlayDeckStore = createSelectors(useOverlayDeckStoreBase)

export default useOverlayDeckStore
