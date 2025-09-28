import { create } from 'zustand'
import { setImmer, createSelectors } from '@campfire/state/utils'
import type { Element } from 'hast'

export interface StoryDataState {
  storyData: Record<string, unknown>
  passages: Element[]
  overlayPassages: Element[]
  currentPassageId?: string
  setStoryData: (data: Record<string, unknown>) => void
  setPassages: (passages: Element[]) => void
  setOverlayPassages: (passages: Element[]) => void
  setCurrentPassage: (id: string | undefined) => void
  getCurrentPassage: () => Element | undefined
  getPassageById: (id: string) => Element | undefined
  getPassageByName: (name: string) => Element | undefined
}

const useStoryDataStoreBase = create<StoryDataState>((set, get) => {
  const immer = setImmer<StoryDataState>(set)
  return {
    storyData: {},
    passages: [],
    overlayPassages: [],
    currentPassageId: undefined,
    setStoryData: data =>
      immer(state => {
        state.storyData = data
      }),
    setPassages: passages =>
      immer(state => {
        state.passages = passages
      }),
    setOverlayPassages: passages =>
      immer(state => {
        state.overlayPassages = passages
      }),
    setCurrentPassage: id =>
      immer(state => {
        state.currentPassageId = id
      }),
    getCurrentPassage: () => {
      const state = get()
      const { currentPassageId } = state
      if (!currentPassageId) return undefined
      return (
        state.getPassageById(currentPassageId) ||
        state.getPassageByName(currentPassageId)
      )
    },
    getPassageById: id =>
      get().passages.find(p => String(p.properties?.pid) === String(id)),
    getPassageByName: name =>
      get().passages.find(p => p.properties?.name === name)
  }
})

/** Story data store with selector helpers. */
export const useStoryDataStore = createSelectors(useStoryDataStoreBase)

/**
 * Retrieves the current story title from the story data store or DOM fallback.
 *
 * Falls back to reading the `name` attribute on the `<tw-storydata>` element
 * when the store has not yet been populated, ensuring directive expressions can
 * safely access the story title during early initialization.
 *
 * @returns The story title when available, otherwise undefined.
 */
export const getStoryTitle = (): string | undefined => {
  const state = useStoryDataStore.getState()
  const { storyData } = state
  const name = storyData?.name
  if (typeof name === 'string' && name.trim()) {
    return name
  }

  const doc = globalThis.document
  const title = doc?.querySelector('tw-storydata')?.getAttribute('name')?.trim()

  return title || undefined
}
;(globalThis as { getStoryTitle?: typeof getStoryTitle }).getStoryTitle =
  getStoryTitle
