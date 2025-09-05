import { useEffect, useMemo, useRef } from 'preact/hooks'
import { SKIP } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import type { DirectiveHandler } from '@campfire/remark-campfire'
import type { Parent, RootContent, Text as MdText, InlineCode } from 'mdast'
import type { Properties } from 'hast'
import type { ContainerDirective } from 'mdast-util-directive'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { useGameStore } from '@campfire/state/useGameStore'
import {
  type DirectiveNode,
  type ExtractedAttrs,
  type AttributeSchema,
  filterDirectiveChildren,
  extractAttributes,
  removeNode,
  stripLabel
} from '@campfire/utils/directiveUtils'
import { parseNumericValue } from '@campfire/utils/math'
import {
  replaceWithIndentation,
  expandIndentedCode,
  runDirectiveBlock
} from '@campfire/utils/directiveUtils'
import {
  getClassAttr,
  getStyleAttr,
  requireLeafDirective,
  removeDirectiveMarker,
  isMarkerParagraph,
  parseDeckSize,
  parseThemeValue,
  applyAdditionalAttributes,
  mergeAttrs,
  normalizeStringAttrs,
  ensureParentIndex
} from '@campfire/utils/directiveHandlerUtils'
import type {
  Transition,
  Direction
} from '@campfire/components/Deck/Slide/types'
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
import { isWhitespaceRootContent } from '@campfire/utils/nodePredicates'

const NUMERIC_PATTERN = /^\d+$/
const ALLOWED_ONEXIT_DIRECTIVES = new Set([
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
  'batch'
])
const ALLOWED_EFFECT_DIRECTIVES = ALLOWED_ONEXIT_DIRECTIVES
const ALLOWED_BATCH_DIRECTIVES = new Set(
  [...ALLOWED_ONEXIT_DIRECTIVES].filter(name => name !== 'batch')
)
const BANNED_BATCH_DIRECTIVES = new Set(['batch'])

/** Marker inserted to close directive blocks. */
// TODO(campfire): Centralize marker parsing and end-of-block detection
// across remark and handlers to avoid drift; add regression tests that
// cover paragraph vs. bare-text markers, blank lines, and sibling directives.
const DIRECTIVE_MARKER = ':::'

/** Event directives supported by interactive elements. */
const INTERACTIVE_EVENTS = new Set([
  'onMouseEnter',
  'onMouseLeave',
  'onFocus',
  'onBlur'
])

export const useDirectiveHandlers = () => {
  // TODO(campfire): This module is very large; consider splitting handlers
  // into focused files (e.g., state, array, deck/slide, overlay) to improve
  // maintainability and enable more targeted unit tests.
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
  const currentPassageId = useStoryDataStore.use.currentPassageId!() as string
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

  /**
   * Resets per-passage directive state such as checkpoints and onExit usage.
   * Clears existing checkpoint identifiers and error flags, resets OnExit tracking,
   * and updates the last processed passage identifier.
   */
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

  const { handlers: stateDirectiveHandlers, setValue } = createStateHandlers({
    getState: () => state,
    getGameData: () => gameData,
    refreshState,
    addError
  })

  /**
   * Inserts a Show component that displays the value for a key or the result
   * of an expression.
   *
   * @param directive - The directive node representing the show directive.
   * @param parent - The parent AST node containing this directive.
   * @param index - The index of the directive node within its parent.
   */
  const handleShow: DirectiveHandler = (directive, parent, index) => {
    let raw = toString(directive).trim()
    if (
      directive.children &&
      directive.children.length === 1 &&
      directive.children[0].type === 'inlineCode'
    ) {
      raw = `\`${(directive.children[0] as InlineCode).value}\``
    }
    if (!raw) return removeNode(parent, index)
    const keyPattern = /^[A-Za-z_$][A-Za-z0-9_$]*$/
    const props: Record<string, unknown> = keyPattern.test(raw)
      ? { 'data-key': raw }
      : { 'data-expr': raw }
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    if (Object.prototype.hasOwnProperty.call(attrs, 'class')) {
      const msg = 'class is a reserved attribute. Use className instead.'
      console.error(msg)
      addError(msg)
    }
    const classAttr = getClassAttr(attrs, gameData)
    const styleAttr = getStyleAttr(attrs, gameData)
    if (classAttr) props.className = classAttr
    if (styleAttr) props.style = styleAttr
    applyAdditionalAttributes(attrs, props, ['className', 'style'], addError)
    const node: MdText = {
      type: 'text',
      value: '',
      data: {
        hName: 'show',
        hProperties: props as Properties
      }
    }
    const pair = ensureParentIndex(parent, index)
    if (pair) {
      const [p, i] = pair
      return replaceWithIndentation(directive, p, i, [node])
    }
    return index
  }

  /**
   * Determines whether the provided node is a Markdown text node.
   *
   * @param node - The AST node to check.
   * @returns Whether the node is an `MdText` node.
   */
  const isTextNode = (node: RootContent): node is MdText => node.type === 'text'
  const isWhitespaceNode = isWhitespaceRootContent

  /**
   * Merges scoped state changes back into the parent state while optionally
   * excluding a loop variable key.
   *
   * @param prev - The parent state manager.
   * @param scoped - The scoped state manager.
   * @param excludeKey - Optional key to remove from the pending changes.
   */
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
    bannedBatchDirectives: BANNED_BATCH_DIRECTIVES
  })

  /**
   * Processes an `effect` directive and serializes its contents.
   *
   * @param directive - The effect directive node.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within the parent.
   * @returns The index of the inserted node.
   */
  const handleEffect: DirectiveHandler = (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    const [p, i] = pair
    const { attrs, label } = extractAttributes(
      directive,
      p,
      i,
      { watch: { type: 'string' } },
      { label: true }
    )
    const rawWatch = String(attrs.watch ?? label ?? '')
    const watch = rawWatch
      .split(/[\s,]+/)
      .map(k => k.trim())
      .filter(Boolean)
    const container = directive as ContainerDirective
    const allowed = ALLOWED_EFFECT_DIRECTIVES
    const rawChildren = runDirectiveBlock(
      expandIndentedCode(container.children as RootContent[])
    )
    const processedChildren = stripLabel(rawChildren)
    const [filtered, invalid] = filterDirectiveChildren(
      processedChildren,
      allowed
    )
    if (invalid) {
      const allowedList = [...allowed].join(', ')
      const msg = `effect only supports directives: ${allowedList}`
      console.error(msg)
      addError(msg)
    }
    const content = JSON.stringify(filtered)
    const node: Parent = {
      type: 'paragraph',
      children: [{ type: 'text', value: '' }],
      data: { hName: 'effect', hProperties: { watch, content } }
    }
    const newIndex = replaceWithIndentation(directive, p, i, [
      node as RootContent
    ])
    const markerIndex = newIndex + 1
    removeDirectiveMarker(p, markerIndex)
    return [SKIP, newIndex]
  }

  /**
   * Converts an `:input` directive into an Input component bound to game state.
   * When a `type` attribute of `checkbox` or `radio` is provided, delegates to
   * the corresponding directive handler.
   *
   * @param directive - The input directive node.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within its parent.
   * @returns The index of the inserted node.
   */
  const handleOnExit: DirectiveHandler = (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    const [p, i] = pair
    if (lastPassageIdRef.current !== currentPassageId) {
      resetDirectiveState()
    }
    if (onExitErrorRef.current) {
      return removeNode(p, i)
    }
    if (onExitSeenRef.current) {
      onExitErrorRef.current = true
      const msg =
        'Multiple onExit directives in a single passage are not allowed'
      console.error(msg)
      addError(msg)
      return removeNode(p, i)
    }
    onExitSeenRef.current = true
    const container = directive as ContainerDirective
    const allowed = ALLOWED_ONEXIT_DIRECTIVES
    const rawChildren = runDirectiveBlock(
      expandIndentedCode(container.children as RootContent[])
    )
    const processedChildren = stripLabel(rawChildren)
    const [filtered, invalid] = filterDirectiveChildren(
      processedChildren,
      allowed
    )
    if (invalid) {
      const allowedList = [...allowed].join(', ')
      const msg = `onExit only supports directives: ${allowedList}`
      console.error(msg)
      addError(msg)
    }
    const content = JSON.stringify(filtered)
    const node: Parent = {
      type: 'paragraph',
      children: [{ type: 'text', value: '' }],
      data: { hName: 'onExit', hProperties: { content } }
    }
    const newIndex = replaceWithIndentation(directive, p, i, [
      node as RootContent
    ])
    const markerIndex = newIndex + 1
    removeDirectiveMarker(p, markerIndex)
    return [SKIP, newIndex]
  }

  /**
   * Stores attribute presets for reuse by other directives.
   *
   * @param directive - The preset directive node.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within the parent.
   * @returns The index of the removed node.
   */
  const handlePreset: DirectiveHandler = (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    const [p, i] = pair
    const { attrs: presetAttrs } = extractAttributes(
      directive,
      p,
      i,
      {
        type: { type: 'string', required: true },
        name: { type: 'string', required: true }
      },
      { label: false }
    )
    const target = String(presetAttrs.type)
    const name = String(presetAttrs.name)
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const rawAttrs = { ...attrs }
    delete rawAttrs.type
    delete rawAttrs.name
    const parsedAttrs: Record<string, unknown> = { ...rawAttrs }
    for (const key of Object.keys(parsedAttrs)) {
      const val = parsedAttrs[key]
      if (
        typeof val === 'number' ||
        (typeof val === 'string' && NUMERIC_PATTERN.test(val))
      ) {
        parsedAttrs[key] = parseNumericValue(val)
      }
    }
    if (!presetsRef.current[target]) presetsRef.current[target] = {}
    presetsRef.current[target][name] = parsedAttrs
    p.children.splice(i, 1)
    return i
  }

  /**
   * Creates a handler for container directives that converts directive blocks
   * into corresponding hast nodes.
   *
   * @param hName - Tag name or resolver function for the output element.
   * @param schema - Attribute extraction schema.
   * @param mapProps - Maps parsed and raw attributes to element props.
   * @param transform - Optional transformer applied to processed children.
   * @param beforeRemove - Optional callback executed before removing the
   * directive's closing marker; useful for cleaning up sibling nodes based on
   * the marker position.
   * @returns Directive handler for the container.
   */
  const createContainerHandler =
    <S extends AttributeSchema>(
      hName: string | ((attrs: ExtractedAttrs<S>) => string),
      schema: S,
      mapProps: (
        attrs: ExtractedAttrs<S>,
        raw: Record<string, unknown>
      ) => Record<string, unknown>,
      transform?: (
        children: RootContent[],
        attrs: ExtractedAttrs<S>
      ) => RootContent[],
      beforeRemove?: (parent: Parent, markerIndex: number) => void
    ): DirectiveHandler =>
    (directive, parent, index) => {
      const pair = ensureParentIndex(parent, index)
      if (!pair) return
      const [p, i] = pair
      if (directive.type !== 'containerDirective') {
        const msg = `${directive.name} can only be used as a container directive`
        console.error(msg)
        addError(msg)
        return removeNode(p, i)
      }
      const container = directive as ContainerDirective
      const { attrs } = extractAttributes<S>(directive, p, i, schema)
      const rawAttrs = (directive.attributes || {}) as Record<string, unknown>
      const processed = runDirectiveBlock(
        expandIndentedCode(container.children as RootContent[]),
        handlersRef.current
      )
      const stripped = stripLabel(processed)
      const children = transform ? transform(stripped, attrs) : stripped
      const tag = typeof hName === 'function' ? hName(attrs) : hName
      const node: Parent = {
        type: 'paragraph',
        children,
        data: {
          hName: tag,
          hProperties: mapProps(attrs, rawAttrs) as Properties
        }
      }
      const newIndex = replaceWithIndentation(directive, p, i, [
        node as RootContent
      ])
      const markerIndex = newIndex + 1
      if (beforeRemove) beforeRemove(p, markerIndex)
      removeDirectiveMarker(p, markerIndex)
      return [SKIP, newIndex]
    }

  /** Schema describing supported reveal directive attributes. */
  const revealSchema = {
    at: { type: 'number' },
    exitAt: { type: 'number' },
    enter: { type: 'string' },
    exit: { type: 'string' },
    enterDir: { type: 'string' },
    exitDir: { type: 'string' },
    enterDuration: { type: 'number' },
    exitDuration: { type: 'number' },
    onEnter: { type: 'string' },
    interruptBehavior: { type: 'string' },
    className: { type: 'string' },
    style: { type: 'string' },
    from: { type: 'string', expression: false },
    id: { type: 'string' }
  } as const

  type RevealSchema = typeof revealSchema
  type RevealAttrs = ExtractedAttrs<RevealSchema>

  const REVEAL_EXCLUDES = [
    'at',
    'exitAt',
    'enter',
    'exit',
    'enterDir',
    'exitDir',
    'enterDuration',
    'exitDuration',
    'onEnter',
    'interruptBehavior',
    'className',
    'style',
    'id'
  ] as const

  /**
   * Builds a transition object from a base value and optional extras.
   *
   * @param base - Transition key or existing configuration.
   * @param dir - Optional direction to apply.
   * @param duration - Optional duration in milliseconds.
   * @param delay - Optional delay before the transition starts.
   * @param easing - Optional easing function to apply.
   * @returns A transition object when a base is provided.
   */
  const buildTransition = (
    base?: Transition | Transition['type'],
    dir?: Direction,
    duration?: number,
    delay?: number,
    easing?: string
  ): Transition | undefined => {
    if (!base) return undefined
    const t: Transition =
      typeof base === 'string' ? { type: base } : { ...base }
    if (dir) t.dir = dir
    if (typeof duration === 'number') t.duration = duration
    if (typeof delay === 'number') t.delay = delay
    if (easing) t.easing = easing
    return t
  }

  /** Schema describing supported slide directive attributes. */
  const slideSchema = {
    transition: { type: 'string' },
    enter: { type: 'string' },
    exit: { type: 'string' },
    enterDir: { type: 'string' },
    exitDir: { type: 'string' },
    enterDuration: { type: 'number' },
    exitDuration: { type: 'number' },
    enterDelay: { type: 'number' },
    exitDelay: { type: 'number' },
    enterEasing: { type: 'string', expression: false },
    exitEasing: { type: 'string', expression: false },
    steps: { type: 'number' },
    onEnter: { type: 'string' },
    onExit: { type: 'string' },
    from: { type: 'string', expression: false },
    id: { type: 'string' }
  } as const

  type SlideSchema = typeof slideSchema
  type SlideAttrs = ExtractedAttrs<SlideSchema>

  const SLIDE_EXCLUDES = [
    'transition',
    'enter',
    'exit',
    'enterDir',
    'exitDir',
    'enterDuration',
    'exitDuration',
    'enterDelay',
    'exitDelay',
    'enterEasing',
    'exitEasing',
    'steps',
    'onEnter',
    'onExit'
  ] as const

  /** Schema describing supported layer directive attributes. */
  const layerSchema = {
    x: { type: 'number' },
    y: { type: 'number' },
    w: { type: 'number' },
    h: { type: 'number' },
    z: { type: 'number' },
    rotate: { type: 'number' },
    scale: { type: 'number' },
    anchor: { type: 'string' },
    className: { type: 'string' },
    id: { type: 'string' },
    from: { type: 'string', expression: false }
  } as const

  /** List of numeric attributes supported by layer directives. */
  const LAYER_NUMERIC_ATTRS = [
    'x',
    'y',
    'w',
    'h',
    'z',
    'rotate',
    'scale'
  ] as const

  const LAYER_EXCLUDES = [...LAYER_NUMERIC_ATTRS, 'anchor', 'id'] as const

  /** Schema describing supported wrapper directive attributes. */
  const wrapperSchema = {
    as: { type: 'string' },
    from: { type: 'string', expression: false },
    id: { type: 'string' }
  } as const

  type WrapperSchema = typeof wrapperSchema
  type WrapperAttrs = ExtractedAttrs<WrapperSchema>

  /** Schema describing supported text directive attributes. */
  const textSchema = {
    x: { type: 'number' },
    y: { type: 'number' },
    w: { type: 'number' },
    h: { type: 'number' },
    z: { type: 'number' },
    rotate: { type: 'number' },
    scale: { type: 'number' },
    anchor: { type: 'string' },
    as: { type: 'string' },
    align: { type: 'string' },
    size: { type: 'number' },
    weight: { type: 'number' },
    lineHeight: { type: 'number' },
    color: { type: 'string' },
    id: { type: 'string' },
    layerId: { type: 'string' },
    from: { type: 'string', expression: false }
  } as const

  type TextSchema = typeof textSchema
  type TextAttrs = ExtractedAttrs<TextSchema>

  /** Schema describing supported image directive attributes. */
  const imageSchema = {
    x: { type: 'number' },
    y: { type: 'number' },
    w: { type: 'number' },
    h: { type: 'number' },
    z: { type: 'number' },
    rotate: { type: 'number' },
    scale: { type: 'number' },
    anchor: { type: 'string' },
    src: { type: 'string', required: true },
    alt: { type: 'string' },
    style: { type: 'string' },
    className: { type: 'string' },
    layerClassName: { type: 'string' },
    id: { type: 'string' },
    layerId: { type: 'string' },
    from: { type: 'string', expression: false }
  } as const

  type ImageSchema = typeof imageSchema
  type ImageAttrs = ExtractedAttrs<ImageSchema>

  /** Schema describing supported shape directive attributes. */
  const shapeSchema = {
    x: { type: 'number' },
    y: { type: 'number' },
    w: { type: 'number' },
    h: { type: 'number' },
    z: { type: 'number' },
    rotate: { type: 'number' },
    scale: { type: 'number' },
    anchor: { type: 'string' },
    type: { type: 'string', required: true },
    points: { type: 'string' },
    x1: { type: 'number' },
    y1: { type: 'number' },
    x2: { type: 'number' },
    y2: { type: 'number' },
    stroke: { type: 'string' },
    strokeWidth: { type: 'number' },
    fill: { type: 'string' },
    radius: { type: 'number' },
    shadow: { type: 'boolean' },
    className: { type: 'string' },
    layerClassName: { type: 'string' },
    style: { type: 'string' },
    id: { type: 'string' },
    layerId: { type: 'string' },
    from: { type: 'string', expression: false }
  } as const

  type ShapeSchema = typeof shapeSchema
  type ShapeAttrs = ExtractedAttrs<ShapeSchema>

  /**
   * Converts `:::reveal` directives into SlideReveal elements.
   *
   * @param directive - The reveal directive node.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within its parent.
   * @returns Visitor instructions after replacement.
   */
  const handleReveal = createContainerHandler(
    'reveal',
    revealSchema,
    (attrs, raw) => {
      const props: Record<string, unknown> = {}
      const preset = attrs.from
        ? (presetsRef.current['reveal']?.[String(attrs.from)] as
            | (Partial<RevealAttrs> & Record<string, unknown>)
            | undefined)
        : undefined
      let enter = buildTransition(
        preset?.enter as Transition | Transition['type'] | undefined,
        preset?.enterDir as Direction | undefined,
        preset?.enterDuration
      )
      let exit = buildTransition(
        preset?.exit as Transition | Transition['type'] | undefined,
        preset?.exitDir as Direction | undefined,
        preset?.exitDuration
      )
      if (preset) {
        if (typeof preset.at === 'number') props.at = preset.at
        if (typeof preset.exitAt === 'number') props.exitAt = preset.exitAt
        if (preset.interruptBehavior)
          props.interruptBehavior = preset.interruptBehavior
        if (preset.onEnter) props.onEnter = preset.onEnter
        applyAdditionalAttributes(preset, props, REVEAL_EXCLUDES, addError)
      }
      if (typeof attrs.at === 'number') props.at = attrs.at
      if (typeof attrs.exitAt === 'number') props.exitAt = attrs.exitAt
      enter = buildTransition(
        (attrs.enter ?? enter?.type) as
          | Transition
          | Transition['type']
          | undefined,
        (attrs.enterDir as Direction | undefined) ?? enter?.dir,
        attrs.enterDuration ?? enter?.duration
      )
      exit = buildTransition(
        (attrs.exit ?? exit?.type) as
          | Transition
          | Transition['type']
          | undefined,
        (attrs.exitDir as Direction | undefined) ?? exit?.dir,
        attrs.exitDuration ?? exit?.duration
      )
      if (enter) props.enter = enter
      if (exit) props.exit = exit
      if (attrs.interruptBehavior)
        props.interruptBehavior = attrs.interruptBehavior
      if (attrs.onEnter) props.onEnter = attrs.onEnter
      const mergedRaw = mergeAttrs(preset, raw)
      const classAttr =
        typeof mergedRaw.className === 'string'
          ? getClassAttr(mergedRaw, gameData)
          : ''
      if (classAttr) props.className = classAttr
      const styleAttr = getStyleAttr(mergedRaw, gameData)
      if (styleAttr) props.style = styleAttr
      if (attrs.id) props.id = attrs.id
      applyAdditionalAttributes(
        mergedRaw,
        props,
        [...REVEAL_EXCLUDES, 'from', 'id'],
        addError
      )
      return props
    }
  )

  /**
   * Converts a `:::layer` directive into a Layer element.
   *
   * @param directive - The layer directive node.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within its parent.
   * @returns Visitor instructions after replacement.
   */
  const handleLayer = createContainerHandler(
    'layer',
    layerSchema,
    (attrs, raw) => {
      const props: Record<string, unknown> = {}
      const preset = attrs.from
        ? presetsRef.current['layer']?.[String(attrs.from)]
        : undefined
      if (preset) {
        for (const key of LAYER_NUMERIC_ATTRS) {
          const value = preset[key]
          if (typeof value === 'number') props[key] = value
        }
        if (preset.anchor) props.anchor = preset.anchor
        applyAdditionalAttributes(preset, props, LAYER_EXCLUDES, addError)
      }
      for (const key of LAYER_NUMERIC_ATTRS) {
        const value = attrs[key]
        if (typeof value === 'number') props[key] = value
      }
      if (attrs.anchor) props.anchor = attrs.anchor
      const mergedRaw = mergeAttrs(preset, raw)
      props['data-testid'] = 'layer'
      let classAttr = ''
      if (typeof attrs.className === 'string')
        classAttr = getClassAttr({ className: attrs.className }, gameData)
      else if (typeof mergedRaw.className === 'string')
        classAttr = getClassAttr({ className: mergedRaw.className }, gameData)
      if (classAttr) props.className = classAttr
      if (attrs.id) props.id = attrs.id
      applyAdditionalAttributes(
        mergedRaw,
        props,
        [...LAYER_EXCLUDES, 'from', 'layerClassName', 'id'],
        addError
      )
      return props
    },
    undefined,
    (parent, markerIndex) => {
      const layerNode = parent.children[markerIndex - 1] as Parent
      let idx = markerIndex
      let end = idx
      while (
        end < parent.children.length &&
        !isMarkerParagraph(parent.children[end] as RootContent)
      )
        end++
      const pending = parent.children.splice(idx, end - idx) as RootContent[]
      if (end < parent.children.length) parent.children.splice(idx, 1)
      while (idx < parent.children.length) {
        const node = parent.children[idx] as RootContent
        if (isMarkerParagraph(node)) {
          parent.children.splice(idx, 1)
          continue
        }
        // TODO(campfire): Per spec, stop at first sibling directive node
        // (do not fold it into the current container). Add regression tests
        // to ensure we terminate correctly for both paragraph and bare-text
        // markers.
        if (node.type === 'containerDirective' || isWhitespaceNode(node)) {
          pending.push(node)
          parent.children.splice(idx, 1)
          continue
        }
        break
      }
      if (pending.length) {
        const processed = runDirectiveBlock(pending, handlersRef.current)
        if (processed.length) {
          const last = processed[processed.length - 1]
          if (last.type === 'paragraph') {
            const idxText = last.children.findIndex(
              child =>
                isTextNode(child as RootContent) &&
                (child as MdText).value.includes(DIRECTIVE_MARKER)
            )
            if (idxText !== -1) last.children.splice(idxText, 1)
            if (
              last.children.length === 0 ||
              last.children.every(isWhitespaceNode)
            )
              processed.pop()
          }
        }
        layerNode.children.push(...processed)
      }
      let prev = -1
      while (prev !== parent.children.length) {
        prev = parent.children.length
        removeDirectiveMarker(parent, idx)
      }
    }
  )

  /**
   * Converts a `:::wrapper` directive into a basic HTML element.
   *
   * @param directive - The wrapper directive node.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within its parent.
   * @returns Visitor instructions after replacement.
   */
  /**
   * Determines which HTML tag to use for a wrapper directive.
   *
   * @param attrs - Wrapper directive attributes.
   * @returns The tag name to render.
   */
  const resolveWrapperTag = (attrs: WrapperAttrs): string => {
    let tag = typeof attrs.as === 'string' ? attrs.as : undefined
    if (!tag && attrs.from) {
      const preset = presetsRef.current['wrapper']?.[String(attrs.from)] as
        | Record<string, unknown>
        | undefined
      if (typeof preset?.as === 'string') tag = preset.as
    }
    tag = typeof tag === 'string' ? tag : 'div'
    return ['span', 'div', 'p', 'section'].includes(tag) ? tag : 'div'
  }

  const handleWrapper = createContainerHandler(
    resolveWrapperTag,
    wrapperSchema,
    (attrs, raw) => {
      const props: Record<string, unknown> = {}
      const preset = attrs.from
        ? (presetsRef.current['wrapper']?.[String(attrs.from)] as
            | Record<string, unknown>
            | undefined)
        : undefined
      const mergedRaw = mergeAttrs(preset, raw)
      props['data-testid'] = 'wrapper'
      const classAttr =
        typeof mergedRaw.className === 'string'
          ? getClassAttr(mergedRaw, gameData)
          : ''
      props.className = ['campfire-wrapper', classAttr]
        .filter(Boolean)
        .join(' ')
      if (attrs.id) props.id = attrs.id
      applyAdditionalAttributes(
        mergedRaw,
        props,
        ['as', 'className', 'from', 'id'],
        addError
      )
      return props
    },
    children =>
      (
        children.flatMap(child => {
          if (child.type !== 'paragraph') return child
          const paragraph = child as Parent
          const data = paragraph.data as { hName?: unknown } | undefined
          // Preserve paragraphs representing custom elements such as slideImage
          return data && typeof data.hName === 'string'
            ? paragraph
            : paragraph.children
        }) as RootContent[]
      ).filter(child => {
        if (child.type === 'paragraph') {
          const data = (child as Parent).data as { hName?: unknown } | undefined
          if (data && typeof data.hName === 'string') return true
        }
        return !isWhitespaceNode(child as RootContent)
      })
  )
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
    handleWrapper
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

  const mediaHandlers = createMediaHandlers({ addError })

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

  /**
   * Converts a `:text` directive into a SlideText element.
   *
   * @param directive - The text directive node.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within its parent.
   * @returns The index of the inserted node.
   */
  const handleText: DirectiveHandler = (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    const [p, i] = pair
    if (directive.type !== 'containerDirective') {
      const msg = 'text can only be used as a container directive'
      console.error(msg)
      addError(msg)
      return removeNode(p, i)
    }
    const container = directive as ContainerDirective
    const { attrs } = extractAttributes<TextSchema>(directive, p, i, textSchema)
    const raw = (directive.attributes || {}) as Record<string, unknown>
    const preset = attrs.from
      ? presetsRef.current['text']?.[String(attrs.from)]
      : undefined
    const mergedRaw = mergeAttrs(preset, raw)
    const mergedAttrs = mergeAttrs(
      preset,
      attrs as unknown as Record<string, unknown>
    ) as TextAttrs & Record<string, unknown>
    const tagName = mergedAttrs.as ? String(mergedAttrs.as) : 'p'
    const style: string[] = []
    style.push('position:absolute')
    if (typeof mergedAttrs.x === 'number') style.push(`left:${mergedAttrs.x}px`)
    if (typeof mergedAttrs.y === 'number') style.push(`top:${mergedAttrs.y}px`)
    if (typeof mergedAttrs.w === 'number')
      style.push(`width:${mergedAttrs.w}px`)
    if (typeof mergedAttrs.h === 'number')
      style.push(`height:${mergedAttrs.h}px`)
    if (typeof mergedAttrs.z === 'number')
      style.push(`z-index:${mergedAttrs.z}`)
    const transforms: string[] = []
    if (typeof mergedAttrs.rotate === 'number')
      transforms.push(`rotate(${mergedAttrs.rotate}deg)`)
    if (typeof mergedAttrs.scale === 'number')
      transforms.push(`scale(${mergedAttrs.scale})`)
    if (transforms.length) style.push(`transform:${transforms.join(' ')}`)
    if (mergedAttrs.anchor && mergedAttrs.anchor !== 'top-left') {
      const originMap: Record<string, string> = {
        'top-left': '0% 0%',
        top: '50% 0%',
        'top-right': '100% 0%',
        left: '0% 50%',
        center: '50% 50%',
        right: '100% 50%',
        'bottom-left': '0% 100%',
        bottom: '50% 100%',
        'bottom-right': '100% 100%'
      }
      const origin = originMap[mergedAttrs.anchor]
      if (origin) style.push(`transform-origin:${origin}`)
    }
    if (mergedAttrs.align) style.push(`text-align:${mergedAttrs.align}`)
    if (typeof mergedAttrs.size === 'number')
      style.push(`font-size:${mergedAttrs.size}px`)
    if (typeof mergedAttrs.weight === 'number')
      style.push(`font-weight:${mergedAttrs.weight}`)
    if (typeof mergedAttrs.lineHeight === 'number')
      style.push(`line-height:${mergedAttrs.lineHeight}`)
    if (mergedAttrs.color) style.push(`color:${mergedAttrs.color}`)
    const rawStyle = mergedRaw.style
    if (rawStyle) {
      if (typeof rawStyle === 'string') {
        const styleAttr = getStyleAttr({ style: rawStyle }, gameData)
        if (styleAttr) style.push(styleAttr)
      } else if (typeof rawStyle === 'object') {
        const entries = Object.entries(rawStyle as Record<string, unknown>).map(
          ([k, v]) => `${k}:${v}`
        )
        style.push(entries.join(';'))
      }
    }
    const props: Record<string, unknown> = {}
    if (typeof mergedAttrs.x === 'number') props.x = mergedAttrs.x
    if (typeof mergedAttrs.y === 'number') props.y = mergedAttrs.y
    if (typeof mergedAttrs.w === 'number') props.w = mergedAttrs.w
    if (typeof mergedAttrs.h === 'number') props.h = mergedAttrs.h
    if (typeof mergedAttrs.z === 'number') props.z = mergedAttrs.z
    if (typeof mergedAttrs.rotate === 'number')
      props.rotate = mergedAttrs.rotate
    if (typeof mergedAttrs.scale === 'number') props.scale = mergedAttrs.scale
    if (mergedAttrs.anchor) props.anchor = mergedAttrs.anchor
    if (style.length) props.style = style.join(';')
    const classAttr =
      typeof mergedRaw.className === 'string'
        ? getClassAttr(mergedRaw, gameData)
        : undefined
    const layerClassAttr =
      typeof mergedRaw.layerClassName === 'string'
        ? getClassAttr({ className: mergedRaw.layerClassName }, gameData)
        : undefined
    const classes = ['text-base', 'font-normal']
    if (classAttr) classes.unshift(classAttr)
    props.className = classes.join(' ')
    if (layerClassAttr) props.layerClassName = layerClassAttr
    if (mergedAttrs.id) props.id = mergedAttrs.id
    if (mergedAttrs.layerId) props.layerId = mergedAttrs.layerId
    props['data-component'] = 'slideText'
    props['data-as'] = tagName
    applyAdditionalAttributes(
      mergedRaw,
      props,
      [
        'x',
        'y',
        'w',
        'h',
        'z',
        'rotate',
        'scale',
        'anchor',
        'as',
        'align',
        'size',
        'weight',
        'lineHeight',
        'color',
        'style',
        'className',
        'layerClassName',
        'id',
        'layerId',
        'from'
      ],
      addError
    )
    const processed = runDirectiveBlock(
      expandIndentedCode(container.children as RootContent[]),
      handlersRef.current
    )
    const stripped = stripLabel(processed)
    const content = toString(stripped).trim()
    const node: Parent = {
      type: 'paragraph',
      children: [{ type: 'text', value: content } as RootContent],
      data: { hName: tagName, hProperties: props as Properties }
    }
    return replaceWithIndentation(directive, p, i, [node as RootContent])
  }

  /**
   * Converts an `image` directive into a SlideImage element.
   *
   * @param directive - The image directive node.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within its parent.
   * @returns The index of the inserted node.
   */
  const handleImage: DirectiveHandler = (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    const [p, i] = pair
    const invalid = requireLeafDirective(directive, p, i, addError)
    if (invalid !== undefined) return invalid
    const { attrs } = extractAttributes<ImageSchema>(
      directive,
      p,
      i,
      imageSchema
    )
    const raw = (directive.attributes || {}) as Record<string, unknown>
    const preset = attrs.from
      ? (presetsRef.current['image']?.[
          String(attrs.from)
        ] as Partial<ImageAttrs>)
      : undefined
    const mergedRaw = mergeAttrs<Record<string, unknown>>(preset, raw)
    const mergedAttrs = mergeAttrs<ImageAttrs>(preset, attrs)
    const normRaw = normalizeStringAttrs(mergedRaw, gameData)
    const normAttrs = normalizeStringAttrs(mergedAttrs, gameData)
    const props: Record<string, unknown> = { src: normAttrs.src }
    if (typeof normAttrs.x === 'number') props.x = normAttrs.x
    if (typeof normAttrs.y === 'number') props.y = normAttrs.y
    if (typeof normAttrs.w === 'number') props.w = normAttrs.w
    if (typeof normAttrs.h === 'number') props.h = normAttrs.h
    if (typeof normAttrs.z === 'number') props.z = normAttrs.z
    if (typeof normAttrs.rotate === 'number') props.rotate = normAttrs.rotate
    if (typeof normAttrs.scale === 'number') props.scale = normAttrs.scale
    if (normAttrs.anchor) props.anchor = normAttrs.anchor
    if (normAttrs.alt) props.alt = normAttrs.alt
    if (normAttrs.className) props.className = normAttrs.className
    if (normAttrs.layerClassName)
      props.layerClassName = normAttrs.layerClassName
    if (normAttrs.style) props.style = normAttrs.style
    if (normAttrs.id) props.id = normAttrs.id
    if (normAttrs.layerId) props.layerId = normAttrs.layerId
    applyAdditionalAttributes(
      normRaw,
      props,
      [
        'x',
        'y',
        'w',
        'h',
        'z',
        'rotate',
        'scale',
        'anchor',
        'src',
        'alt',
        'style',
        'className',
        'layerClassName',
        'id',
        'layerId',
        'from'
      ],
      addError
    )
    const data = {
      hName: 'slideImage',
      hProperties: props as Properties
    }
    const node: Parent = { type: 'paragraph', children: [], data }
    return replaceWithIndentation(directive, p, i, [node as RootContent])
  }

  /**
   * Converts a `:shape` directive into a SlideShape element.
   *
   * @param directive - The shape directive node.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within its parent.
   * @returns The index of the inserted node.
   */
  const handleShape: DirectiveHandler = (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    const [p, i] = pair
    if (
      directive.type !== 'textDirective' &&
      directive.type !== 'leafDirective'
    ) {
      const msg = 'shape can only be used as a leaf or text directive'
      console.error(msg)
      addError(msg)
      return removeNode(p, i)
    }
    const { attrs } = extractAttributes<ShapeSchema>(
      directive,
      p,
      i,
      shapeSchema
    )
    const raw = (directive.attributes || {}) as Record<string, unknown>
    const preset = attrs.from
      ? presetsRef.current['shape']?.[String(attrs.from)]
      : undefined
    const mergedRaw = mergeAttrs(preset, raw)
    const mergedAttrs = mergeAttrs(
      preset,
      attrs as unknown as Record<string, unknown>
    ) as ShapeAttrs & Record<string, unknown>
    const normRaw = normalizeStringAttrs(mergedRaw, gameData)
    const normAttrs = normalizeStringAttrs(
      mergedAttrs,
      gameData
    ) as ShapeAttrs & Record<string, unknown>
    const props: Record<string, unknown> = { type: normAttrs.type }
    if (typeof normAttrs.x === 'number') props.x = normAttrs.x
    if (typeof normAttrs.y === 'number') props.y = normAttrs.y
    if (typeof normAttrs.w === 'number') props.w = normAttrs.w
    if (typeof normAttrs.h === 'number') props.h = normAttrs.h
    if (typeof normAttrs.z === 'number') props.z = normAttrs.z
    if (typeof normAttrs.rotate === 'number') props.rotate = normAttrs.rotate
    if (typeof normAttrs.scale === 'number') props.scale = normAttrs.scale
    if (normAttrs.anchor) props.anchor = normAttrs.anchor
    if (normAttrs.points) props.points = normAttrs.points
    if (typeof normAttrs.x1 === 'number') props.x1 = normAttrs.x1
    if (typeof normAttrs.y1 === 'number') props.y1 = normAttrs.y1
    if (typeof normAttrs.x2 === 'number') props.x2 = normAttrs.x2
    if (typeof normAttrs.y2 === 'number') props.y2 = normAttrs.y2
    if (normAttrs.stroke) props.stroke = normAttrs.stroke
    if (typeof normAttrs.strokeWidth === 'number')
      props.strokeWidth = normAttrs.strokeWidth
    if (normAttrs.fill) props.fill = normAttrs.fill
    if (typeof normAttrs.radius === 'number') props.radius = normAttrs.radius
    if (typeof normAttrs.shadow === 'boolean') props.shadow = normAttrs.shadow
    if (normAttrs.className) props.className = normAttrs.className
    if (normAttrs.layerClassName)
      props.layerClassName = normAttrs.layerClassName
    if (normAttrs.style) props.style = normAttrs.style
    if (normAttrs.id) props.id = normAttrs.id
    if (normAttrs.layerId) props.layerId = normAttrs.layerId
    applyAdditionalAttributes(
      normRaw,
      props,
      [
        'x',
        'y',
        'w',
        'h',
        'z',
        'rotate',
        'scale',
        'anchor',
        'type',
        'points',
        'x1',
        'y1',
        'x2',
        'y2',
        'stroke',
        'strokeWidth',
        'fill',
        'radius',
        'shadow',
        'style',
        'className',
        'layerClassName',
        'id',
        'layerId',
        'from'
      ],
      addError
    )
    const node: Parent = {
      type: 'paragraph',
      children: [],
      data: { hName: 'slideShape', hProperties: props as Properties }
    }
    return replaceWithIndentation(directive, p, i, [node as RootContent])
  }

  /**
   * Builds a props object for the Slide component from extracted attributes.
   *
   * @param attrs - Extracted slide attributes.
   * @returns Slide props object.
   */
  const buildSlideProps = (
    attrs: SlideAttrs,
    raw: Record<string, unknown> = {}
  ): Record<string, unknown> => {
    const props: Record<string, unknown> = {}
    const preset = attrs.from
      ? (presetsRef.current['slide']?.[String(attrs.from)] as
          | (Partial<SlideAttrs> & Record<string, unknown>)
          | undefined)
      : undefined
    let enter = buildTransition(
      (preset?.enter ?? preset?.transition) as
        | Transition
        | Transition['type']
        | undefined,
      preset?.enterDir as Direction | undefined,
      preset?.enterDuration,
      preset?.enterDelay,
      preset?.enterEasing
    )
    let exit = buildTransition(
      (preset?.exit ?? preset?.transition) as
        | Transition
        | Transition['type']
        | undefined,
      preset?.exitDir as Direction | undefined,
      preset?.exitDuration,
      preset?.exitDelay,
      preset?.exitEasing
    )
    if (preset) {
      if (typeof preset.steps === 'number') props.steps = preset.steps
      if (preset.onEnter) props.onEnter = preset.onEnter
      if (preset.onExit) props.onExit = preset.onExit
    }
    enter = buildTransition(
      (attrs.enter ?? attrs.transition ?? enter?.type) as
        | Transition
        | Transition['type']
        | undefined,
      (attrs.enterDir as Direction | undefined) ?? enter?.dir,
      attrs.enterDuration ?? enter?.duration,
      attrs.enterDelay ?? enter?.delay,
      attrs.enterEasing ?? enter?.easing
    )
    exit = buildTransition(
      (attrs.exit ?? attrs.transition ?? exit?.type) as
        | Transition
        | Transition['type']
        | undefined,
      (attrs.exitDir as Direction | undefined) ?? exit?.dir,
      attrs.exitDuration ?? exit?.duration,
      attrs.exitDelay ?? exit?.delay,
      attrs.exitEasing ?? exit?.easing
    )
    if (enter || exit) {
      props.transition = {
        ...(enter ? { enter } : {}),
        ...(exit ? { exit } : {})
      }
    }
    if (typeof attrs.steps === 'number') props.steps = attrs.steps
    if (attrs.onEnter) props.onEnter = attrs.onEnter
    if (attrs.onExit) props.onExit = attrs.onExit
    const mergedRaw = mergeAttrs(preset, raw)
    applyAdditionalAttributes(
      mergedRaw,
      props,
      [...SLIDE_EXCLUDES, 'from'],
      addError
    )
    return props
  }

  const DECK_EXCLUDES = [
    'size',
    'transition',
    'theme',
    'autoplay',
    'autoplayDelay',
    'pause',
    'id',
    'hideNavigation',
    'showSlideCount',
    'initialSlide',
    'a11y'
  ] as const

  /**
   * Converts a `:::deck` directive into a Deck element with Slide children.
   *
   * @param directive - The deck directive node.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within its parent.
   * @returns Visitor instructions after replacement.
   */
  const handleDeck: DirectiveHandler = (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    const [p, i] = pair
    if (directive.type !== 'containerDirective') {
      const msg = 'deck can only be used as a container directive'
      console.error(msg)
      addError(msg)
      return removeNode(p, i)
    }
    const container = directive as ContainerDirective

    const { attrs: deckAttrs } = extractAttributes(
      directive,
      p,
      i,
      {
        size: { type: 'string' },
        transition: { type: 'string' },
        theme: { type: 'string' },
        from: { type: 'string', expression: false },
        autoplay: { type: 'boolean' },
        autoplayDelay: { type: 'number' },
        pause: { type: 'boolean' },
        id: { type: 'string' },
        hideNavigation: { type: 'boolean' },
        showSlideCount: { type: 'boolean' },
        initialSlide: { type: 'number' },
        a11y: { type: 'object', expression: false }
      },
      { label: false }
    )

    const deckProps: Record<string, unknown> = {}
    if (deckAttrs.from) {
      const preset = presetsRef.current['deck']?.[String(deckAttrs.from)]
      if (preset) {
        if (typeof preset.size === 'string')
          deckProps.size = parseDeckSize(preset.size as string)
        if (preset.transition) deckProps.transition = preset.transition
        if ('theme' in preset) {
          const t = parseThemeValue(preset.theme)
          if (t) deckProps.theme = t
        }
        applyAdditionalAttributes(preset, deckProps, DECK_EXCLUDES, addError)
      }
    }
    if (typeof deckAttrs.size === 'string') {
      deckProps.size = parseDeckSize(deckAttrs.size)
    }
    if (deckAttrs.transition) deckProps.transition = deckAttrs.transition
    if ('theme' in deckAttrs) {
      const theme = parseThemeValue(deckAttrs.theme)
      if (theme) deckProps.theme = theme
    }
    if (deckAttrs.autoplay) {
      deckProps.autoAdvanceMs =
        typeof deckAttrs.autoplayDelay === 'number'
          ? deckAttrs.autoplayDelay
          : 3000
      if (deckAttrs.pause) deckProps.autoAdvancePaused = true
    }
    if (deckAttrs.hideNavigation) deckProps.hideNavigation = true
    if (deckAttrs.showSlideCount) deckProps.showSlideCount = true
    if (typeof deckAttrs.initialSlide === 'number')
      deckProps.initialSlide = deckAttrs.initialSlide
    if (deckAttrs.id) deckProps.id = deckAttrs.id
    if (typeof deckAttrs.a11y === 'string') {
      try {
        deckProps.a11y = JSON.parse(deckAttrs.a11y)
      } catch {
        /* ignore */
      }
    } else if (deckAttrs.a11y) {
      deckProps.a11y = deckAttrs.a11y
    }
    const rawDeckAttrs = (directive.attributes || {}) as Record<string, unknown>
    applyAdditionalAttributes(
      rawDeckAttrs,
      deckProps,
      [...DECK_EXCLUDES, 'from', 'id'],
      addError
    )

    const slides: Parent[] = []

    let endPos = p.children.length
    for (let j = p.children.length - 1; j > i; j--) {
      if (isMarkerParagraph(p.children[j] as RootContent)) {
        endPos = j
        break
      }
    }
    const rawFollowing = p.children.slice(i + 1, endPos)
    if (endPos > i + 1) {
      p.children.splice(i + 1, endPos - (i + 1))
    }
    const following = rawFollowing.filter(
      node =>
        !isMarkerParagraph(node as RootContent) &&
        !isWhitespaceNode(node as RootContent)
    )

    const children: RootContent[] = stripLabel(
      runDirectiveBlock(
        expandIndentedCode([
          ...(container.children as RootContent[]),
          ...following
        ])
      )
    ).filter(
      child =>
        !isMarkerParagraph(child as RootContent) &&
        !isWhitespaceNode(child as RootContent)
    )
    let pendingAttrs: Record<string, unknown> = {}
    let pendingNodes: RootContent[] = []

    /**
     * Finalizes the currently buffered slide content and adds it to the deck.
     * Removes any trailing directive markers before running the remark
     * pipeline so stray markers do not render in the output. When buffered
     * content has no slide attributes and at least one slide already exists,
     * the nodes are merged into the previous slide instead of creating a new
     * one. This prevents stray directives, such as `:::reveal`, from being
     * lifted to the deck level and causing empty slides.
     */
    const commitPending = () => {
      const tempParent: Parent = { type: 'root', children: pendingNodes }
      removeDirectiveMarker(tempParent, tempParent.children.length - 1)
      pendingNodes = tempParent.children
      while (pendingNodes.length && isWhitespaceNode(pendingNodes[0]))
        pendingNodes.shift()
      while (
        pendingNodes.length &&
        isWhitespaceNode(pendingNodes[pendingNodes.length - 1])
      )
        pendingNodes.pop()

      if (pendingNodes.length === 0 && Object.keys(pendingAttrs).length === 0)
        return
      const processed = runDirectiveBlock(
        expandIndentedCode(pendingNodes),
        handlersRef.current
      )
      const content = stripLabel(processed)
      const attrsEmpty = Object.keys(pendingAttrs).length === 0
      if (slides.length > 0 && attrsEmpty) {
        const lastSlide = slides[slides.length - 1]
        ;(lastSlide.children as RootContent[]).push(...content)
      } else {
        const dummy: DirectiveNode = {
          type: 'containerDirective',
          name: 'slide',
          attributes: pendingAttrs as Record<string, string | null>,
          children: []
        }
        const { attrs: parsed } = extractAttributes<SlideSchema>(
          dummy,
          undefined,
          undefined,
          slideSchema
        )
        const slideNode: Parent = {
          type: 'paragraph',
          children: content,
          data: {
            hName: 'slide',
            hProperties: buildSlideProps(
              parsed,
              pendingAttrs as Record<string, unknown>
            ) as Properties
          }
        }
        slides.push(slideNode)
      }
      pendingAttrs = {}
      pendingNodes = []
    }

    children.forEach((child, i) => {
      if (
        child.type === 'containerDirective' &&
        (child as ContainerDirective).name === 'slide'
      ) {
        commitPending()
        const slideDir = child as ContainerDirective
        const { attrs: parsed } = extractAttributes<SlideSchema>(
          slideDir,
          container,
          i,
          slideSchema
        )
        const processed = runDirectiveBlock(
          expandIndentedCode(slideDir.children as RootContent[]),
          handlersRef.current
        )
        const content = stripLabel(processed)
        const slideNode: Parent = {
          type: 'paragraph',
          children: content,
          data: {
            hName: 'slide',
            hProperties: buildSlideProps(
              parsed,
              slideDir.attributes as Record<string, unknown>
            ) as Properties
          }
        }
        slides.push(slideNode)
      } else {
        pendingNodes.push(child)
      }
    })
    commitPending()

    const deckNode: Parent = {
      type: 'paragraph',
      children: slides as RootContent[],
      data: { hName: 'deck', hProperties: deckProps as Properties }
    }
    const newIndex = replaceWithIndentation(directive, p, i, [
      deckNode as RootContent
    ])
    removeDirectiveMarker(p, newIndex + 1)
    return [SKIP, newIndex]
  }

  return useMemo(() => {
    // noinspection JSUnusedGlobalSymbols
    const handlers = {
      ...stateDirectiveHandlers,
      show: handleShow,
      ...controlFlowHandlers,
      option: handleOption,
      select: handleSelect,
      trigger: handleTrigger,
      input: handleInput,
      checkbox: handleCheckbox,
      radio: handleRadio,
      textarea: handleTextarea,
      effect: handleEffect,
      onExit: handleOnExit,
      reveal: handleReveal,
      layer: handleLayer,
      wrapper: handleWrapper,
      text: handleText,
      image: handleImage,
      shape: handleShape,
      preset: handlePreset,
      deck: handleDeck,
      ...i18nHandlers,
      ...navigationHandlers,
      ...mediaHandlers,
      ...persistenceHandlers
    }
    handlersRef.current = handlers
    return handlers
  }, [])
}
