import { create } from 'zustand'
import {
  createDeckStore,
  type DeckState
} from '@campfire/state/createDeckStore'

/**
 * Zustand store for overlay decks to keep their navigation state persistent
 * across passage changes.
 */
export const useOverlayDeckStore = create<DeckState>(
  createDeckStore({ persistent: true })
)

export default useOverlayDeckStore
