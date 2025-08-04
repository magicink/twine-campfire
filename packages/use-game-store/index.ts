import { produce } from 'immer'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

const fastHash = (obj: Record<string, unknown>): number => {
  const str = JSON.stringify(obj)
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export interface GameState<T = Record<string, unknown>> {
  /** Arbitrary game state */
  gameData: T
  /** Fast hash of the current game data */
  hash: number
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
  /** Saved checkpoints */
  checkpoints: Record<string, Checkpoint<T>>
  /** Save a checkpoint */
  saveCheckpoint: (id: string, checkpoint: CheckpointData<T>) => void
  /** Restore a checkpoint and return its data */
  restoreCheckpoint: (id?: string) => Checkpoint<T> | undefined
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

export const useGameStore = create(
  subscribeWithSelector<InternalState<Record<string, unknown>>>((set, get) => ({
    gameData: {},
    _initialGameData: {},
    lockedKeys: {},
    onceKeys: {},
    loading: false,
    errors: [],
    checkpoints: {},
    hash: fastHash({}),
    init: data =>
      set(() => ({
        gameData: { ...data },
        _initialGameData: { ...data },
        onceKeys: {},
        errors: [],
        loading: false,
        hash: fastHash(data as Record<string, unknown>)
      })),
    setGameData: data =>
      set(
        produce((state: InternalState<Record<string, unknown>>) => {
          for (const [k, v] of Object.entries(data)) {
            if (!state.lockedKeys[k]) {
              ;(state.gameData as Record<string, unknown>)[k] = v
            }
          }
          state.hash = fastHash(state.gameData)
        })
      ),
    unsetGameData: key =>
      set(
        produce((state: InternalState<Record<string, unknown>>) => {
          const k = key as string
          delete (state.gameData as Record<string, unknown>)[k]
          delete state.lockedKeys[k]
          state.hash = fastHash(state.gameData)
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
    setLoading: loading => set({ loading }),
    addError: error =>
      set(
        produce((state: InternalState<Record<string, unknown>>) => {
          state.errors.push(error)
        })
      ),
    clearErrors: () => set({ errors: [] }),
    saveCheckpoint: (id, checkpoint) =>
      set(
        produce((state: InternalState<Record<string, unknown>>) => {
          state.checkpoints[id] = {
            ...checkpoint,
            timestamp: Date.now()
          }
        })
      ),
    removeCheckpoint: id =>
      set(
        produce((state: InternalState<Record<string, unknown>>) => {
          delete state.checkpoints[id]
        })
      ),
    restoreCheckpoint: id => {
      const cps = get().checkpoints
      const cp = id
        ? cps[id]
        : Object.values(cps).reduce<
            Checkpoint<Record<string, unknown>> | undefined
          >(
            (latest, current) =>
              !latest || current.timestamp >= latest.timestamp
                ? current
                : latest,
            undefined
          )
      if (cp) {
        set({
          gameData: { ...cp.gameData },
          lockedKeys: { ...cp.lockedKeys },
          onceKeys: { ...cp.onceKeys },
          hash: fastHash(cp.gameData)
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
        loading: false,
        hash: fastHash(state._initialGameData as Record<string, unknown>)
      }))
  }))
)
