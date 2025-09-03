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
