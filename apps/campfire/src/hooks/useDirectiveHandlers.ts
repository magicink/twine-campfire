import { useEffect, useMemo, useRef } from 'preact/hooks'
import type { DirectiveHandler } from '@campfire/remark-campfire'
import type { Parent, RootContent, Text as MdText } from 'mdast'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { useGameStore } from '@campfire/state/useGameStore'
import {
  createStateManager,
  type StateManagerType
} from '@campfire/state/stateManager'
import { createStateHandlers } from './handlers/stateHandlers'
import { createControlFlowHandlers } from './handlers/controlFlowHandlers'
import { createFormHandlers } from './handlers/formHandlers'
import { createNavigationHandlers } from './handlers/navigationHandlers'
import { createMediaHandlers } from './handlers/mediaHandlers'
import { createPersistenceHandlers } from './handlers/persistenceHandlers'
import { createI18nHandlers } from './handlers/i18nHandlers'
import { createStoryHandlers } from './handlers/storyHandlers'
import { createLayoutHandlers } from './handlers/layoutHandlers'
import { createTextHandlers } from './handlers/textHandlers'

const CONTROL_FLOW_DIRECTIVES = new Set([
  'set',
  'setOnce',
  'array',
  'arrayOnce',
  'createRange',
  'setRange',
  'unset',
  'random',
  'randomOnce',
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'concat',
  'checkpoint',
  'loadCheckpoint',
  'clearCheckpoint',
  'save',
  'load',
  'clearSave',
  'lang',
  'translations',
  'if',
  'for',
  'switch',
  'batch'
])
const ALLOWED_BATCH_DIRECTIVES = new Set(
  [...CONTROL_FLOW_DIRECTIVES].filter(name => name !== 'batch')
)
const BANNED_BATCH_DIRECTIVES = new Set(['batch'])

const INTERACTIVE_EVENTS = new Set([
  'onMouseEnter',
  'onMouseLeave',
  'onFocus',
  'onBlur'
])

export const useDirectiveHandlers = () => {
  const stateRef = useRef<StateManagerType<Record<string, unknown>>>()
  if (!stateRef.current) {
    stateRef.current = createStateManager<Record<string, unknown>>()
  }
  let state = stateRef.current
  let gameData = state.getState()
  let lockedKeys = state.getLockedKeys()
  let onceKeys = state.getOnceKeys()

  const saveCheckpoint = useGameStore.use.saveCheckpoint()
  const removeCheckpoint = useGameStore.use.removeCheckpoint()
  const loadCheckpointFn = useGameStore.use.loadCheckpoint()
  const setLoading = useGameStore.use.setLoading()
  const addError = useGameStore.use.addError()
  const currentPassageIdSelector = useStoryDataStore.use.currentPassageId
  if (!currentPassageIdSelector) {
    addError('currentPassageId selector is undefined')
  }
  const currentPassageId = currentPassageIdSelector?.() ?? ''
  const setCurrentPassage = useStoryDataStore.use.setCurrentPassage()
  const getPassageById = useStoryDataStore.use.getPassageById()
  const getPassageByName = useStoryDataStore.use.getPassageByName()
  const handlersRef = useRef<Record<string, DirectiveHandler>>({})
  const presetsRef = useRef<
    Record<string, Record<string, Record<string, unknown>>>
  >({})
  const checkpointIdRef = useRef<string | null>(null)
  const checkpointErrorRef = useRef(false)
  const onExitSeenRef = useRef(false)
  const onExitErrorRef = useRef(false)
  const lastPassageIdRef = useRef<string | undefined>(undefined)
  let includeDepth = 0
  let lastLayerNode: { layer: Parent; parent: Parent } | undefined

  const resetDirectiveState = () => {
    checkpointIdRef.current = null
    checkpointErrorRef.current = false
    onExitSeenRef.current = false
    onExitErrorRef.current = false
    lastPassageIdRef.current = currentPassageId
  }

  useEffect(() => {
    resetDirectiveState()
  }, [currentPassageId])

  const refreshState = () => {
    gameData = state.getState()
    lockedKeys = state.getLockedKeys()
    onceKeys = state.getOnceKeys()
  }

  const getPreset = <T>(type: string, name: string): T | undefined =>
    presetsRef.current[type]?.[name] as T | undefined

  const setPreset = (
    type: string,
    name: string,
    attrs: Record<string, unknown>
  ) => {
    if (!presetsRef.current[type]) presetsRef.current[type] = {}
    presetsRef.current[type][name] = attrs
  }

  const { handlers: stateDirectiveHandlers, setValue } = createStateHandlers({
    getState: () => state,
    getGameData: () => gameData,
    refreshState,
    addError
  })

  const isTextNode = (node: RootContent): node is MdText => node.type === 'text'

  const mergeScopedChanges = (
    prev: StateManagerType<Record<string, unknown>>,
    scoped: StateManagerType<Record<string, unknown>>,
    excludeKey?: string
  ) => {
    const changes = scoped.getChanges()
    if (excludeKey) {
      delete (changes.data as Record<string, unknown>)[excludeKey]
      changes.unset = changes.unset.filter(k => k !== excludeKey)
      changes.locks = changes.locks.filter(k => k !== excludeKey)
      changes.once = changes.once.filter(k => k !== excludeKey)
    }
    state = prev
    state.applyChanges(changes)
    gameData = state.getState()
    lockedKeys = state.getLockedKeys()
    onceKeys = state.getOnceKeys()
  }

  const controlFlowHandlers = createControlFlowHandlers({
    addError,
    setValue,
    mergeScopedChanges,
    handlersRef,
    getState: () => state,
    setState: s => {
      state = s
    },
    getGameData: () => gameData,
    setGameData: data => {
      gameData = data
    },
    getLockedKeys: () => lockedKeys,
    setLockedKeys: keys => {
      lockedKeys = keys
    },
    getOnceKeys: () => onceKeys,
    setOnceKeys: keys => {
      onceKeys = keys
    },
    isTextNode,
    allowedBatchDirectives: ALLOWED_BATCH_DIRECTIVES,
    bannedBatchDirectives: BANNED_BATCH_DIRECTIVES,
    getLastLayerNode: () => lastLayerNode,
    clearLastLayerNode: () => {
      lastLayerNode = undefined
    }
  })

  const storyHandlers = createStoryHandlers({
    addError,
    getGameData: () => gameData,
    setPreset,
    getCurrentPassageId: () => currentPassageId,
    getLastPassageId: () => lastPassageIdRef.current,
    resetDirectiveState,
    isOnExitSeen: () => onExitSeenRef.current,
    setOnExitSeen: seen => {
      onExitSeenRef.current = seen
    },
    isOnExitErrored: () => onExitErrorRef.current,
    setOnExitError: value => {
      onExitErrorRef.current = value
    }
  })

  const layoutHandlers = createLayoutHandlers({
    addError,
    getGameData: () => gameData,
    getPreset,
    getDirectiveHandlers: () => handlersRef.current,
    setLastLayerNode: (layer, parent) => {
      lastLayerNode = { layer, parent }
    },
    getLastLayerNode: () => lastLayerNode,
    clearLastLayerNode: () => {
      lastLayerNode = undefined
    }
  })

  const textHandlers = createTextHandlers({
    addError,
    getGameData: () => gameData,
    getPreset,
    getDirectiveHandlers: () => handlersRef.current
  })

  const {
    input: handleInput,
    checkbox: handleCheckbox,
    radio: handleRadio,
    textarea: handleTextarea,
    option: handleOption,
    select: handleSelect,
    trigger: handleTrigger
  } = createFormHandlers({
    addError,
    getGameData: () => gameData,
    interactiveEvents: INTERACTIVE_EVENTS,
    handleWrapper: layoutHandlers.wrapper
  })

  const navigationHandlers = createNavigationHandlers({
    addError,
    setCurrentPassage,
    getPassageById,
    getPassageByName,
    getGameData: () => gameData,
    handlersRef,
    getIncludeDepth: () => includeDepth,
    incrementIncludeDepth: () => {
      includeDepth++
    },
    decrementIncludeDepth: () => {
      includeDepth--
    }
  })

  const mediaHandlers = createMediaHandlers({
    addError,
    getGameData: () => gameData,
    getPreset
  })

  const i18nHandlers = createI18nHandlers({
    addError,
    getGameData: () => gameData
  })

  const { handlers: persistenceHandlers } = createPersistenceHandlers({
    getState: () => state,
    getCurrentPassageId: () => currentPassageId,
    getLastPassageId: () => lastPassageIdRef.current,
    resetDirectiveState,
    setCurrentPassage,
    setLoading,
    addError,
    getCheckpoints: () => useGameStore.getState().checkpoints,
    saveCheckpoint,
    removeCheckpoint,
    loadCheckpoint: () => loadCheckpointFn(),
    setGameStoreState: useGameStore.setState,
    getIncludeDepth: () => includeDepth,
    getCheckpointId: () => checkpointIdRef.current,
    setCheckpointId: id => {
      checkpointIdRef.current = id
    },
    getCheckpointError: () => checkpointErrorRef.current,
    setCheckpointError: err => {
      checkpointErrorRef.current = err
    }
  })

  return useMemo(() => {
    const handlers = {
      ...stateDirectiveHandlers,
      ...storyHandlers,
      ...controlFlowHandlers,
      option: handleOption,
      select: handleSelect,
      trigger: handleTrigger,
      input: handleInput,
      checkbox: handleCheckbox,
      radio: handleRadio,
      textarea: handleTextarea,
      ...layoutHandlers,
      ...textHandlers,
      ...mediaHandlers,
      ...i18nHandlers,
      ...navigationHandlers,
      ...persistenceHandlers
    }
    handlersRef.current = handlers
    return handlers
  }, [])
}
