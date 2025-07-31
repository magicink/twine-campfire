import { produce } from 'immer'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export interface GameState<T = Record<string, unknown>> {
  /** Arbitrary game state */
  gameData: T
  /** Current locale for the game */
  locale: string
  /** Initialize gameData and remember the initial state */
  init: (data: T) => void
  /** Merge partial data into existing gameData */
  setGameData: (data: Partial<T>) => void
  /** Remove a key from gameData */
  unsetGameData: (key: keyof T | string) => void
  /** Set the current locale */
  setLocale: (locale: string) => void
  /** Reset gameData to the initial state */
  reset: () => void
}

interface InternalState<T> extends GameState<T> {
  /** Internal storage for the initial state */
  _initialGameData: T
}

export const useGameStore = create(
  subscribeWithSelector<InternalState<Record<string, unknown>>>(set => ({
    gameData: {},
    _initialGameData: {},
    locale: 'en-US',
    init: data =>
      set(() => ({
        gameData: { ...data },
        _initialGameData: { ...data }
      })),
    setGameData: data =>
      set(
        produce((state: InternalState<Record<string, unknown>>) => {
          state.gameData = { ...state.gameData, ...data }
        })
      ),
    unsetGameData: key =>
      set(
        produce((state: InternalState<Record<string, unknown>>) => {
          delete (state.gameData as Record<string, unknown>)[key as string]
        })
      ),
    setLocale: locale =>
      set(
        produce((state: InternalState<Record<string, unknown>>) => {
          state.locale = locale
        })
      ),
    reset: () =>
      set(state => ({
        gameData: { ...state._initialGameData }
      }))
  }))
)
