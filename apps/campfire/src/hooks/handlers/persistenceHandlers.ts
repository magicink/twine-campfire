import i18next from 'i18next'
import type { DirectiveHandler } from '@campfire/remark-campfire'
import type { Checkpoint, CheckpointData } from '@campfire/state/useGameStore'
import type { StateManagerType } from '@campfire/state/stateManager'
import { ensureKey, removeNode } from '@campfire/utils/directiveUtils'
import { requireLeafDirective } from '@campfire/utils/directiveHandlerUtils'

/**
 * Context required to create persistence directive handlers.
 */
export interface PersistenceHandlerContext {
  /** Retrieves the current state manager. */
  getState: () => StateManagerType<Record<string, unknown>>
  /** Retrieves the current passage identifier. */
  getCurrentPassageId: () => string
  /** Retrieves the last processed passage identifier. */
  getLastPassageId: () => string | undefined
  /** Resets directive state between passages. */
  resetDirectiveState: () => void
  /** Sets the current passage identifier. */
  setCurrentPassage: (id: string) => void
  /** Toggles the loading state. */
  setLoading: (loading: boolean) => void
  /** Records an error message. */
  addError: (msg: string) => void
  /** Retrieves saved checkpoints. */
  getCheckpoints: () => Record<string, Checkpoint<Record<string, unknown>>>
  /** Saves a checkpoint. */
  saveCheckpoint: (
    id: string,
    cp: CheckpointData<Record<string, unknown>>
  ) => void
  /** Removes a checkpoint. */
  removeCheckpoint: (id: string) => void
  /** Loads a checkpoint. */
  loadCheckpoint: () => Checkpoint<Record<string, unknown>> | undefined
  /** Updates game store state. */
  setGameStoreState: (
    state: Partial<{
      gameData: Record<string, unknown>
      lockedKeys: Record<string, true>
      onceKeys: Record<string, true>
      checkpoints: Record<string, Checkpoint<Record<string, unknown>>>
    }>
  ) => void
  /** Retrieves current include depth. */
  getIncludeDepth: () => number
  /** Gets the active checkpoint id. */
  getCheckpointId: () => string | null
  /** Sets the active checkpoint id. */
  setCheckpointId: (id: string | null) => void
  /** Gets whether a checkpoint error has occurred. */
  getCheckpointError: () => boolean
  /** Flags that a checkpoint error has occurred. */
  setCheckpointError: (err: boolean) => void
}

/**
 * Creates handlers for persistence directives (`:save`, `:load`, `:clearSave`,
 * `::checkpoint`, `::loadCheckpoint`, `::clearCheckpoint`).
 *
 * @param ctx - Context providing state access and utilities.
 * @returns An object containing persistence directive handlers.
 */
export const createPersistenceHandlers = (ctx: PersistenceHandlerContext) => {
  const {
    getState,
    getCurrentPassageId,
    getLastPassageId,
    resetDirectiveState,
    setCurrentPassage,
    setLoading,
    addError,
    getCheckpoints,
    saveCheckpoint,
    removeCheckpoint,
    loadCheckpoint,
    setGameStoreState,
    getIncludeDepth,
    getCheckpointId,
    setCheckpointId,
    getCheckpointError,
    setCheckpointError
  } = ctx

  /**
   * Saves the current game state to local storage.
   *
   * @param directive - The directive node being processed.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within the parent.
   */
  const handleSave: DirectiveHandler = (directive, parent, index) => {
    const invalid = requireLeafDirective(directive, parent, index, addError)
    if (invalid !== undefined) return invalid
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const id = typeof attrs.id === 'string' ? attrs.id : 'campfire.save'
    setLoading(true)
    try {
      if ('localStorage' in globalThis) {
        const cps = getCheckpoints()
        const state = getState()
        const data = {
          gameData: { ...(state.getState() as Record<string, unknown>) },
          lockedKeys: { ...state.getLockedKeys() },
          onceKeys: { ...state.getOnceKeys() },
          checkpoints: { ...cps },
          currentPassageId: getCurrentPassageId()
        }
        globalThis.localStorage.setItem(id, JSON.stringify(data))
      }
    } catch (error) {
      console.error('Error saving game state:', error)
      addError('Failed to save game state')
    } finally {
      setLoading(false)
    }
    return removeNode(parent, index)
  }

  /**
   * Loads a game state from local storage.
   *
   * @param directive - The directive node being processed.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within the parent.
   */
  const handleLoad: DirectiveHandler = (directive, parent, index) => {
    const invalid = requireLeafDirective(directive, parent, index, addError)
    if (invalid !== undefined) return invalid
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const id = typeof attrs.id === 'string' ? attrs.id : 'campfire.save'
    setLoading(true)
    try {
      if ('localStorage' in globalThis) {
        const raw = globalThis.localStorage.getItem(id)
        if (raw) {
          const data = JSON.parse(raw) as {
            gameData?: Record<string, unknown>
            lockedKeys?: Record<string, true>
            onceKeys?: Record<string, true>
            checkpoints?: Record<string, Checkpoint<Record<string, unknown>>>
            currentPassageId?: string
          }
          setGameStoreState({
            gameData: { ...(data.gameData || {}) },
            lockedKeys: { ...(data.lockedKeys || {}) },
            onceKeys: { ...(data.onceKeys || {}) },
            checkpoints: { ...(data.checkpoints || {}) }
          })
          if (data.currentPassageId) {
            setCurrentPassage(data.currentPassageId)
          } else {
            const msg = 'Saved game state has no current passage'
            console.error(msg)
            addError(msg)
          }
        }
      }
    } catch (error) {
      console.error('Error loading game state:', error)
      addError('Failed to load game state')
    } finally {
      setLoading(false)
    }
    return removeNode(parent, index)
  }

  /**
   * Clears a saved game state from local storage.
   *
   * @param directive - The directive node being processed.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within the parent.
   */
  const handleClearSave: DirectiveHandler = (directive, parent, index) => {
    const invalid = requireLeafDirective(directive, parent, index, addError)
    if (invalid !== undefined) return invalid
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const id = typeof attrs.id === 'string' ? attrs.id : 'campfire.save'
    setLoading(true)
    try {
      if ('localStorage' in globalThis) {
        globalThis.localStorage.removeItem(id)
      }
    } catch (error) {
      console.error('Error clearing saved game state:', error)
      addError('Failed to clear saved game state')
    } finally {
      setLoading(false)
    }
    return removeNode(parent, index)
  }

  /**
   * Saves a checkpoint of the current game state.
   *
   * @param directive - The directive node being processed.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within the parent.
   */
  const handleCheckpoint: DirectiveHandler = (directive, parent, index) => {
    const invalid = requireLeafDirective(directive, parent, index, addError)
    if (invalid !== undefined) return invalid
    if (getLastPassageId() !== getCurrentPassageId()) {
      resetDirectiveState()
    }
    if (getIncludeDepth() > 0) return removeNode(parent, index)
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const id = ensureKey(attrs.id, parent, index)
    if (!id) return index
    if (getCheckpointError()) {
      return removeNode(parent, index)
    }
    const existing = getCheckpointId()
    if (existing) {
      removeCheckpoint(existing)
      setCheckpointId(null)
      setCheckpointError(true)
      const msg = 'Multiple checkpoints in a single passage are not allowed'
      console.error(msg)
      addError(msg)
      return removeNode(parent, index)
    }
    setCheckpointId(id)
    const label =
      typeof attrs.label === 'string' ? i18next.t(attrs.label) : undefined
    const state = getState()
    saveCheckpoint(id, {
      gameData: { ...(state.getState() as Record<string, unknown>) },
      lockedKeys: { ...state.getLockedKeys() },
      onceKeys: { ...state.getOnceKeys() },
      currentPassageId: getCurrentPassageId(),
      label
    })
    return removeNode(parent, index)
  }

  /**
   * Loads the previously saved checkpoint.
   *
   * @param directive - The directive node being processed.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within the parent.
   */
  const handleLoadCheckpoint: DirectiveHandler = (directive, parent, index) => {
    const invalid = requireLeafDirective(directive, parent, index, addError)
    if (invalid !== undefined) return invalid
    if (getIncludeDepth() > 0) return removeNode(parent, index)
    const cp = loadCheckpoint()
    if (cp?.currentPassageId) {
      setCurrentPassage(cp.currentPassageId)
    }
    return removeNode(parent, index)
  }

  /**
   * Clears any saved checkpoints.
   *
   * @param directive - The directive node being processed.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within the parent.
   */
  const handleClearCheckpoint: DirectiveHandler = (
    directive,
    parent,
    index
  ) => {
    const invalid = requireLeafDirective(directive, parent, index, addError)
    if (invalid !== undefined) return invalid
    if (getIncludeDepth() > 0) return removeNode(parent, index)
    setGameStoreState({ checkpoints: {} })
    return removeNode(parent, index)
  }

  return {
    handlers: {
      save: handleSave,
      load: handleLoad,
      clearSave: handleClearSave,
      checkpoint: handleCheckpoint,
      loadCheckpoint: handleLoadCheckpoint,
      clearCheckpoint: handleClearCheckpoint
    }
  }
}
