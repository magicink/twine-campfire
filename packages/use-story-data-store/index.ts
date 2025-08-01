import { produce } from 'immer'
import { create } from 'zustand'
import type { Element } from 'hast'

export interface StoryDataState {
  storyData: Record<string, unknown>
  passages: Element[]
  currentPassageId?: string
  setStoryData: (data: Record<string, unknown>) => void
  setPassages: (passages: Element[]) => void
  setCurrentPassage: (id: string | undefined) => void
  getCurrentPassage: () => Element | undefined
  getPassageById: (id: string) => Element | undefined
  getPassageByName: (name: string) => Element | undefined
}

export const useStoryDataStore = create<StoryDataState>((set, get) => ({
  storyData: {},
  passages: [],
  currentPassageId: undefined,
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
