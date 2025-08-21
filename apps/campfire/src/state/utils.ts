import { produce } from 'immer'
import type { Draft } from 'immer'
import type { StoreApi } from 'zustand'
import rfdc from 'rfdc'
import { clamp } from '@campfire/utils/directiveUtils'

/**
 * Zustand's `set` function signature.
 *
 * @template T - The state shape managed by the store.
 */
type SetFn<T extends object> = StoreApi<T>['setState']

/**
 * Wraps Zustand's set function with Immer's produce for immutable updates.
 *
 * @param set - The original Zustand set function.
 * @returns A function accepting an Immer recipe to update state.
 */
export const setImmer =
  <T extends object>(set: SetFn<T>) =>
  (fn: (draft: Draft<T>) => void) =>
    set(produce<T>(fn))

/** Range value representation */
export interface RangeValue {
  min: number
  max: number
  value: number
}

/** Options for setting values */
export interface SetOptions {
  /** Lock the key after setting */
  lock?: boolean
  /** Mark the key as executed once */
  once?: boolean
}

/** Changes recorded within a scoped manager */
export interface StateChanges<T> {
  data: Partial<T>
  unset: string[]
  locks: string[]
  once: string[]
}

// disable prototype and circular checks for performance as game data is plain
const clone = rfdc({ proto: false, circles: false })

/**
 * Manages game state operations and tracks modified keys.
 */
export class StateManager<T extends Record<string, unknown>> {
  private data: T
  private locked: Record<string, true>
  private once: Record<string, true>
  private modified = new Set<string>()
  private pending: {
    data: Partial<T>
    unset: Set<string>
    locks: Set<string>
    once: Set<string>
  }

  constructor(
    private readonly setGameData: (data: Partial<T>) => void,
    private readonly unsetGameData: (key: string) => void,
    private readonly lockKey: (key: string) => void,
    private readonly markOnceFn: (key: string) => void,
    data: T,
    locked: Record<string, true>,
    once: Record<string, true>,
    private readonly scoped = false
  ) {
    this.data = clone(data)
    this.locked = { ...locked }
    this.once = { ...once }
    this.pending = {
      data: {},
      unset: new Set<string>(),
      locks: new Set<string>(),
      once: new Set<string>()
    }
  }

  /** Returns the current game data snapshot. */
  getState = (): T => this.data

  /** Returns the set of locked keys. */
  getLockedKeys = (): Record<string, true> => this.locked

  /** Returns the set of once keys. */
  getOnceKeys = (): Record<string, true> => this.once

  /** Retrieves a value by path. */
  getValue = (path: string): unknown =>
    path.split('.').reduce<unknown>((acc, part) => {
      if (acc == null) return undefined
      return (acc as Record<string, unknown>)[part]
    }, this.data)

  /** Checks if a value exists at the given path. */
  hasValue = (path: string): boolean =>
    typeof this.getValue(path) !== 'undefined'

  /** Records a modified top-level key. */
  private record = (key: string) => {
    this.modified.add(key)
    if (this.pending.unset.has(key)) this.pending.unset.delete(key)
    this.pending.data[key as keyof T] = this.data[key as keyof T]
  }

  /** Sets a value at the provided path. */
  setValue = (path: string, value: unknown, opts: SetOptions = {}) => {
    const parts = path.split('.')
    const top = parts[0]
    if (parts.length === 1) {
      ;(this.data as Record<string, unknown>)[top] = value
    } else {
      const base =
        typeof this.data[top] === 'object' && this.data[top] !== null
          ? { ...(this.data[top] as Record<string, unknown>) }
          : {}
      let cursor = base
      for (let i = 1; i < parts.length - 1; i++) {
        const p = parts[i]
        const next =
          typeof cursor[p] === 'object' && cursor[p] !== null
            ? { ...(cursor[p] as Record<string, unknown>) }
            : {}
        cursor[p] = next
        cursor = next
      }
      cursor[parts[parts.length - 1]] = value
      ;(this.data as Record<string, unknown>)[top] = base
    }
    if (opts.once) {
      this.once[top] = true
      this.pending.once.add(top)
      if (!this.scoped) this.markOnceFn(top)
    }
    this.record(top)
    if (!this.scoped) this.setGameData({ [top]: this.data[top] } as Partial<T>)
    if (opts.lock) {
      this.locked[top] = true
      this.pending.locks.add(top)
      if (!this.scoped) this.lockKey(top)
    }
  }

  /**
   * Stores a range value at the provided path.
   *
   * Avoids triggering state updates when the clamped value does not change,
   * preventing unnecessary re-renders.
   *
   * @param path - Dot separated path where the range should be stored.
   * @param min - Minimum allowed value for the range.
   * @param max - Maximum allowed value for the range.
   * @param value - Current value to assign within the range.
   * @param opts - Additional options controlling assignment behavior.
   */
  setRange = (
    path: string,
    min: number,
    max: number,
    value: number,
    opts: SetOptions = {}
  ) => {
    const clamped = clamp(value, min, max)
    const existing = this.getValue(path) as RangeValue | undefined
    if (
      existing &&
      existing.min === min &&
      existing.max === max &&
      existing.value === clamped
    )
      return

    this.setValue(path, { min, max, value: clamped }, opts)
  }

  /** Removes a value from the provided path. */
  unsetValue = (path: string) => {
    const parts = path.split('.')
    const top = parts[0]
    if (parts.length === 1) {
      delete (this.data as Record<string, unknown>)[top]
      this.pending.unset.add(top)
      this.modified.add(top)
      delete this.locked[top]
      delete this.once[top]
      if (!this.scoped) this.unsetGameData(top)
      return
    }

    const base = this.data[top]
    if (typeof base !== 'object' || base === null) return

    const cloneBase = { ...(base as Record<string, unknown>) }
    let cursor: Record<string, unknown> = cloneBase
    let valid = true
    for (let i = 1; i < parts.length - 1; i++) {
      const p = parts[i]
      const next = cursor[p]
      if (typeof next !== 'object' || next === null) {
        valid = false
        break
      }
      cursor[p] = { ...(next as Record<string, unknown>) }
      cursor = cursor[p] as Record<string, unknown>
    }

    if (!valid) return

    delete cursor[parts[parts.length - 1]]
    ;(this.data as Record<string, unknown>)[top] = cloneBase
    this.record(top)
    if (!this.scoped) this.setGameData({ [top]: this.data[top] } as Partial<T>)
  }

  /** Locks a top-level key. */
  lock = (key: string) => {
    this.locked[key] = true
    this.pending.locks.add(key)
    this.modified.add(key)
    if (!this.scoped) this.lockKey(key)
  }

  /** Marks a once key. */
  markOnce = (key: string) => {
    this.once[key] = true
    this.pending.once.add(key)
    if (!this.scoped) this.markOnceFn(key)
  }

  /** Returns an array of modified top-level keys. */
  getModifiedKeys = (): string[] => Array.from(this.modified)

  /** Retrieves pending changes for scoped managers. */
  getChanges = (): StateChanges<T> => ({
    data: { ...this.pending.data },
    unset: Array.from(this.pending.unset),
    locks: Array.from(this.pending.locks),
    once: Array.from(this.pending.once)
  })

  /** Applies pending changes to the underlying store. */
  applyChanges = (changes: StateChanges<T>) => {
    if (Object.keys(changes.data).length > 0) {
      this.setGameData(changes.data)
      Object.assign(this.data, changes.data)
    }
    for (const k of changes.unset) {
      this.unsetGameData(k)
      delete (this.data as Record<string, unknown>)[k]
      delete this.locked[k]
      delete this.once[k]
    }
    for (const k of changes.locks) {
      this.lockKey(k)
      this.locked[k] = true
    }
    for (const k of changes.once) {
      this.markOnceFn(k)
      this.once[k] = true
    }
    for (const k of [
      ...Object.keys(changes.data),
      ...changes.unset,
      ...changes.locks,
      ...changes.once
    ]) {
      this.modified.add(k)
    }
  }

  /** Creates a scoped state manager for temporary operations. */
  createScope = (): StateManager<T> =>
    new StateManager(
      this.setGameData,
      this.unsetGameData,
      this.lockKey,
      this.markOnceFn,
      this.data,
      this.locked,
      this.once,
      true
    )
}

export type { StateManager as StateManagerType }
