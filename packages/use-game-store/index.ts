import { produce } from 'immer'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export interface GameState<T = Record<string, unknown>> {
  /** Arbitrary game state */
  gameData: T
  /** Initialize gameData and remember the initial state */
  init: (data: T) => void
  /** Merge partial data into existing gameData */
  setGameData: (data: Partial<T>) => void
  /** Remove a key from gameData */
  unsetGameData: (key: keyof T | string) => void
  /** Reset gameData to the initial state */
  reset: () => void
  /** Keys that have been permanently set */
  lockedKeys: Record<string, true>
  /** Prevent further updates to a key */
  lockKey: (key: keyof T | string) => void
  /** Allow updates to a key */
  unlockKey: (key: keyof T | string) => void
  /** Blocks or directives that have run once */
  onceKeys: Record<string, true>
  /** Mark a once key as executed */
  markOnce: (key: string) => void
}

interface InternalState<T> extends GameState<T> {
  /** Internal storage for the initial state */
  _initialGameData: T
}

export const useGameStore = create(
  subscribeWithSelector<InternalState<Record<string, unknown>>>(set => ({
    gameData: {},
    _initialGameData: {},
    lockedKeys: {},
    onceKeys: {},
    init: data =>
      set(() => ({
        gameData: { ...data },
        _initialGameData: { ...data },
        onceKeys: {}
      })),
    setGameData: data =>
      set(
        produce((state: InternalState<Record<string, unknown>>) => {
          for (const [k, v] of Object.entries(data)) {
            if (!state.lockedKeys[k]) {
              ;(state.gameData as Record<string, unknown>)[k] = v
            }
          }
        })
      ),
    unsetGameData: key =>
      set(
        produce((state: InternalState<Record<string, unknown>>) => {
          const k = key as string
          delete (state.gameData as Record<string, unknown>)[k]
          delete state.lockedKeys[k]
        })
      ),
    lockKey: key =>
      set(
        produce((state: InternalState<Record<string, unknown>>) => {
          state.lockedKeys[key as string] = true
        })
      ),
    unlockKey: key =>
      set(
        produce((state: InternalState<Record<string, unknown>>) => {
          delete state.lockedKeys[key as string]
        })
      ),
    markOnce: key =>
      set(
        produce((state: InternalState<Record<string, unknown>>) => {
          state.onceKeys[key] = true
        })
      ),
    reset: () =>
      set(state => ({
        gameData: { ...state._initialGameData },
        lockedKeys: {},
        onceKeys: {}
      }))
  }))
)
