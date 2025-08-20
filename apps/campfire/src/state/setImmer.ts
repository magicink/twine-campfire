import { produce } from 'immer'
import type { Draft } from 'immer'

/**
 * Wraps Zustand's set function with Immer's produce for immutable updates.
 *
 * @param set - The original Zustand set function.
 * @returns A function accepting an Immer recipe to update state.
 */
type SetFn<T> = (fn: (state: T) => T) => void

export const setImmer =
  <T extends object>(set: SetFn<T>) =>
  (fn: (draft: Draft<T>) => void) =>
    set(produce(fn))
