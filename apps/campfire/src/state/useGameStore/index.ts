import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { setImmer } from '@campfire/state/utils'

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
  /** Indicates persistence operations are in progress */
  loading: boolean
  /** Set the loading state */
  setLoading: (loading: boolean) => void
  /** Recorded errors */
  errors: string[]
  /** Add an error to the list */
  addError: (error: string) => void
  /** Clear all errors */
  clearErrors: () => void
  /** Saved checkpoints (only one is stored at a time) */
  checkpoints: Record<string, Checkpoint<T>>
  /**
   * Save a checkpoint, replacing any existing checkpoint.
   *
   * @param id - Unique identifier for the checkpoint.
   * @param checkpoint - The checkpoint data to store.
   */
  saveCheckpoint: (id: string, checkpoint: CheckpointData<T>) => void
  /**
   * Load a checkpoint and return its data. If no ID is provided, loads the
   * currently stored checkpoint.
   *
   * @param id - Optional identifier of the checkpoint to load.
   */
  loadCheckpoint: (id?: string) => Checkpoint<T> | undefined
  /** Remove a checkpoint */
  removeCheckpoint: (id: string) => void
}

interface InternalState<T> extends GameState<T> {
  /** Internal storage for the initial state */
  _initialGameData: T
}

export interface CheckpointData<T = Record<string, unknown>> {
  gameData: T
  lockedKeys: Record<string, true>
  onceKeys: Record<string, true>
  currentPassageId?: string
  label?: string
}

export interface Checkpoint<T = Record<string, unknown>>
  extends CheckpointData<T> {
  timestamp: number
}

export interface SavedGame {
  /** Storage key for the save */
  id: string
  /** Optional label for the save */
  label?: string
  /** Passage where the save occurs */
  currentPassageId?: string
  /** Timestamp recorded when the save was created */
  timestamp?: number
}

/**
 * Lists saved game entries in local storage.
 *
 * @param prefix - Key prefix to match against storage entries.
 * @returns An array of saved game metadata.
 */
export const listSavedGames = (prefix = 'campfire.save'): SavedGame[] => {
  const saves: SavedGame[] = []
  if (typeof localStorage === 'undefined') return saves
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith(prefix)) continue
    const raw = localStorage.getItem(key)
    if (!raw) continue
    try {
      const data = JSON.parse(raw) as {
        label?: string
        currentPassageId?: string
        timestamp?: number
      }
      saves.push({
        id: key,
        label: data.label,
        currentPassageId: data.currentPassageId,
        timestamp: data.timestamp
      })
    } catch {
      // skip malformed entries
    }
  }
  return saves
}
;(globalThis as { listSavedGames?: typeof listSavedGames }).listSavedGames =
  listSavedGames

export const useGameStore = create(
  subscribeWithSelector<InternalState<Record<string, unknown>>>((set, get) => {
    const immer = setImmer<InternalState<Record<string, unknown>>>(set)
    return {
      gameData: {},
      _initialGameData: {},
      lockedKeys: {},
      onceKeys: {},
      loading: false,
      errors: [],
      checkpoints: {},
      init: data =>
        set(() => ({
          gameData: { ...data },
          _initialGameData: { ...data },
          onceKeys: {},
          errors: [],
          loading: false
        })),
      setGameData: data =>
        immer(state => {
          for (const [k, v] of Object.entries(data)) {
            if (!state.lockedKeys[k]) {
              ;(state.gameData as Record<string, unknown>)[k] = v
            }
          }
        }),
      unsetGameData: key =>
        immer(state => {
          const k = key as string
          delete (state.gameData as Record<string, unknown>)[k]
          delete state.lockedKeys[k]
        }),
      lockKey: key =>
        immer(state => {
          state.lockedKeys[key as string] = true
        }),
      unlockKey: key =>
        immer(state => {
          delete state.lockedKeys[key as string]
        }),
      markOnce: key =>
        immer(state => {
          state.onceKeys[key] = true
        }),
      setLoading: loading => set({ loading }),
      addError: error =>
        immer(state => {
          state.errors.push(error)
        }),
      clearErrors: () => set({ errors: [] }),
      /**
       * Saves a checkpoint, replacing any existing checkpoint.
       *
       * @param id - Unique identifier for the checkpoint.
       * @param checkpoint - The checkpoint data to store.
       */
      saveCheckpoint: (id, checkpoint) =>
        immer(state => {
          state.checkpoints = {
            [id]: {
              ...checkpoint,
              timestamp: Date.now()
            }
          }
        }),
      /**
       * Removes a checkpoint.
       *
       * @param id - Identifier of the checkpoint to remove.
       */
      removeCheckpoint: id =>
        immer(state => {
          delete state.checkpoints[id]
        }),
      /**
       * Loads a checkpoint.
       *
       * @param id - Optional identifier of the checkpoint to load.
       * @returns The loaded checkpoint, if found.
       */
      loadCheckpoint: id => {
        const cps = get().checkpoints
        const cp = id ? cps[id] : Object.values(cps)[0]
        if (cp) {
          set({
            gameData: { ...cp.gameData },
            lockedKeys: { ...cp.lockedKeys },
            onceKeys: { ...cp.onceKeys }
          })
          return cp
        }
        const msg = `Checkpoint not found${id ? `: ${id}` : ''}`
        console.error(msg)
        get().addError(msg)
        return undefined
      },
      reset: () =>
        set(state => ({
          gameData: { ...state._initialGameData },
          lockedKeys: {},
          onceKeys: {},
          errors: [],
          loading: false
        }))
    }
  })
)
