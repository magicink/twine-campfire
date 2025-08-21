import { useGameStore } from '@campfire/state/useGameStore'
import { StateManager } from './utils'

/** Creates a StateManager instance bound to the game store. */
export const createStateManager = <T extends Record<string, unknown>>() => {
  const state = useGameStore.getState()
  return new StateManager<T>(
    state.setGameData as (data: Partial<T>) => void,
    state.unsetGameData as (key: string) => void,
    state.lockKey as (key: string) => void,
    state.markOnce as (key: string) => void,
    state.gameData as T,
    state.lockedKeys,
    state.onceKeys
  )
}

export type {
  StateManager as StateManagerType,
  SetOptions,
  RangeValue,
  StateChanges
} from './utils'
