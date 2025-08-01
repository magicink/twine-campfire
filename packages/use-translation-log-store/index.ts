import { create } from 'zustand'
import { produce } from 'immer'

export interface TranslationLogEntry {
  key: string
  result: string
  count?: number
}

export interface TranslationLogState {
  entries: TranslationLogEntry[]
  logTranslation: (
    key: string,
    result: string,
    options?: { count?: number }
  ) => void
  reset: () => void
}

export const useTranslationLogStore = create<TranslationLogState>(set => ({
  entries: [],
  logTranslation: (key, result, options) =>
    set(
      produce((state: TranslationLogState) => {
        state.entries.push({ key, result, count: options?.count })
      })
    ),
  reset: () => set({ entries: [] })
}))
