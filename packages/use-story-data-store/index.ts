import { create } from 'zustand'
import type { Element } from 'hast'

export interface StoryDataState {
  storyData: Record<string, unknown>
  passages: Element[]
  currentPassageId?: string
  /** Current locale for the story */
  locale: string
  setStoryData: (data: Record<string, unknown>) => void
  setPassages: (passages: Element[]) => void
  setCurrentPassage: (id: string | undefined) => void
  setLocale: (locale: string) => void
  getCurrentPassage: () => Element | undefined
  getPassageById: (id: string) => Element | undefined
  getPassageByName: (name: string) => Element | undefined
}

export const useStoryDataStore = create<StoryDataState>((set, get) => ({
  storyData: {},
  passages: [],
  currentPassageId: undefined,
  locale: 'en-US',
  setStoryData: data =>
    set({
      storyData: data
    }),
  setPassages: passages =>
    set({
      passages
    }),
  setCurrentPassage: id =>
    set({
      currentPassageId: id
    }),
  setLocale: locale =>
    set({
      locale
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
}))
