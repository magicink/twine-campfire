import { produce } from 'immer'
import { create } from 'zustand'
import type { Element } from 'hast'

export interface StoryDataState {
  storyData: Record<string, unknown>
  passages: Element[]
  currentPassageId?: string
  /** Current locale for the story */
  locale: string
  /** Log of translations */
  translations: { key: string; result: string; count?: number }[]
  logTranslation: (
    key: string,
    result: string,
    options?: { count?: number }
  ) => void
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
  translations: [],
  logTranslation: (key, result, options) =>
    set(
      produce((state: StoryDataState) => {
        state.translations.push({ key, result, count: options?.count })
      })
    ),
  setStoryData: data =>
    set(
      produce((state: StoryDataState) => {
        state.storyData = data
      })
    ),
  setPassages: passages =>
    set(
      produce((state: StoryDataState) => {
        state.passages = passages
      })
    ),
  setCurrentPassage: id =>
    set(
      produce((state: StoryDataState) => {
        state.currentPassageId = id
      })
    ),
  setLocale: locale =>
    set(
      produce((state: StoryDataState) => {
        state.locale = locale
      })
    ),
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
