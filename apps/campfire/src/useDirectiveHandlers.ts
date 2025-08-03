import { useEffect, useMemo, useRef } from 'react'
import i18next from 'i18next'
import { SKIP } from 'unist-util-visit'
import { compile } from 'expression-eval'
import { toString } from 'mdast-util-to-string'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import remarkCampfire from '@/packages/remark-campfire'
import type { Text as MdText, Parent, RootContent, Root } from 'mdast'
import type { Text as HastText, ElementContent } from 'hast'
import type { ContainerDirective } from 'mdast-util-directive'
import { useStoryDataStore } from '@/packages/use-story-data-store'
import { useGameStore, type Checkpoint } from '@/packages/use-game-store'
import {
  isRange,
  clamp,
  parseNumericValue,
  getRandomItem,
  getRandomInt,
  ensureKey,
  removeNode,
  type DirectiveNode,
  convertRanges,
  getLabel,
  stripLabel
} from './directives/helpers'
import type {
  DirectiveHandler,
  DirectiveHandlerResult
} from '@/packages/remark-campfire'

export const useDirectiveHandlers = () => {
  const gameData = useGameStore(state => state.gameData)
  const setGameData = useGameStore(state => state.setGameData)
  const unsetGameData = useGameStore(state => state.unsetGameData)
  const markOnce = useGameStore(state => state.markOnce)
  const onceKeys = useGameStore(state => state.onceKeys)
  const lockKey = useGameStore(state => state.lockKey)
  const lockedKeys = useGameStore(state => state.lockedKeys)
  const saveCheckpoint = useGameStore(state => state.saveCheckpoint)
  const removeCheckpoint = useGameStore(state => state.removeCheckpoint)
  const restoreCheckpointFn = useGameStore(state => state.restoreCheckpoint)
  const setLoading = useGameStore(state => state.setLoading)
  const addError = useGameStore(state => state.addError)
  const clearErrors = useGameStore(state => state.clearErrors)
  const currentPassageId = useStoryDataStore(state => state.currentPassageId)
  const setCurrentPassage = useStoryDataStore(state => state.setCurrentPassage)
  const getPassageById = useStoryDataStore(state => state.getPassageById)
  const getPassageByName = useStoryDataStore(state => state.getPassageByName)
  const handlersRef = useRef<Record<string, DirectiveHandler>>({})
  const exitHandlers = useRef<RootContent[][]>([])
  const changeSubscriptions = useRef<Array<() => void>>([])
  const checkpoints = useGameStore(state => state.checkpoints)
  const checkpointIdRef = useRef<string | null>(null)
  const checkpointErrorRef = useRef(false)
  const lastPassageIdRef = useRef<string | undefined>(undefined)

  const MAX_INCLUDE_DEPTH = 10
  let includeDepth = 0

  /**
   * Processes a block of AST nodes using the unified processor with the remarkCampfire plugin.
   *
   * @param nodes - An array of RootContent nodes to process.
   */
  const runBlock = (nodes: RootContent[]) => {
    const root: Root = { type: 'root', children: nodes }
    unified()
      .use(remarkCampfire, { handlers: handlersRef.current })
      .runSync(root)
  }

  /**
   * Resets the checkpoint state by clearing the current checkpoint ID and error flag,
   * and updating the lastPassageIdRef to the current passage ID.
   */
  const resetCheckpointState = () => {
    checkpointIdRef.current = null
    checkpointErrorRef.current = false
    lastPassageIdRef.current = currentPassageId
  }

  useEffect(() => {
    for (const nodes of exitHandlers.current) {
      runBlock(nodes)
    }
    exitHandlers.current = []
    for (const fn of changeSubscriptions.current) {
      fn()
    }
    changeSubscriptions.current = []
    resetCheckpointState()
  }, [currentPassageId])

  const handleSet = (
    directive: DirectiveNode,
    parent: Parent | undefined,
    index: number | undefined,
    lock = false
  ): DirectiveHandlerResult => {
    const typeParam = (toString(directive).trim() || 'string').toLowerCase()
    const attrs = directive.attributes
    const safe: Record<string, unknown> = {}

    const isRecord = (value: unknown): value is Record<string, unknown> =>
      !!value && typeof value === 'object' && !Array.isArray(value)

    const parseValue = (value: string): unknown => {
      switch (typeParam) {
        case 'number': {
          let evaluated: unknown = value
          try {
            const fn = compile(value)
            evaluated = fn(gameData)
          } catch {
            // fall back to raw value when evaluation fails
          }
          if (typeof evaluated === 'number') return evaluated
          const num = parseFloat(String(evaluated))
          return Number.isNaN(num) ? 0 : num
        }
        case 'boolean':
          return value === 'true'
        case 'object':
          try {
            return JSON.parse(value)
          } catch {
            return {}
          }
        case 'string':
        default:
          return value
      }
    }

    const parseNumber = (value: unknown): number => {
      if (value == null) return 0
      if (typeof value === 'number') return value
      if (typeof value !== 'string') return parseNumericValue(value)
      let evaluated: unknown = value
      try {
        const fn = compile(value)
        evaluated = fn(gameData)
      } catch {
        // fall back to raw value when evaluation fails
      }
      if (evaluated == null) return 0
      return parseNumericValue(evaluated)
    }

    if (isRecord(attrs)) {
      if (typeParam === 'range') {
        const key = typeof attrs.key === 'string' ? attrs.key : undefined
        if (key) {
          const lower = parseNumber(attrs.min)
          const upper = parseNumber(attrs.max)
          const val = parseNumber(attrs.value ?? lower)
          safe[key] = {
            lower,
            upper,
            value: clamp(val, lower, upper)
          }
        }
      } else {
        for (const [key, value] of Object.entries(attrs)) {
          if (typeof value === 'string') {
            const parsed = parseValue(value)
            const current = gameData[key]
            if (isRange(current)) {
              if (typeof parsed === 'number') {
                safe[key] = {
                  ...current,
                  value: clamp(parsed, current.lower, current.upper)
                }
              } else if (isRange(parsed)) {
                safe[key] = {
                  lower: parsed.lower,
                  upper: parsed.upper,
                  value: clamp(parsed.value, parsed.lower, parsed.upper)
                }
              } else {
                safe[key] = parsed
              }
            } else {
              safe[key] = parsed
            }
          }
        }
      }
    }

    if (Object.keys(safe).length > 0) {
      setGameData(safe)
      if (lock) {
        for (const k of Object.keys(safe)) {
          lockKey(k)
        }
      }
    }

    if (parent && typeof index === 'number') {
      parent.children.splice(index, 1)
      return index
    }
  }

  const handleArray = (
    directive: DirectiveNode,
    parent: Parent | undefined,
    index: number | undefined,
    lock = false
  ): DirectiveHandlerResult => {
    const typeParam = (toString(directive).trim() || 'string').toLowerCase()
    const attrs = directive.attributes
    const safe: Record<string, unknown[]> = {}

    const isRecord = (value: unknown): value is Record<string, unknown> =>
      !!value && typeof value === 'object' && !Array.isArray(value)

    const parseValue = (value: string): unknown => {
      switch (typeParam) {
        case 'number': {
          let evaluated: unknown = value
          try {
            const fn = compile(value)
            evaluated = fn(gameData)
          } catch {
            // fall back to raw value when evaluation fails
          }
          if (typeof evaluated === 'number') return evaluated
          const num = parseFloat(String(evaluated))
          return Number.isNaN(num) ? 0 : num
        }
        case 'boolean':
          return value === 'true'
        case 'object':
          try {
            return JSON.parse(value)
          } catch {
            return {}
          }
        case 'string':
        default:
          return value
      }
    }

    if (isRecord(attrs)) {
      for (const [key, value] of Object.entries(attrs)) {
        if (typeof value === 'string') {
          const items = value
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
            .map(parseValue)
          safe[key] = items
        }
      }
    }

    if (Object.keys(safe).length > 0) {
      setGameData(safe)
      if (lock) {
        for (const k of Object.keys(safe)) {
          lockKey(k)
        }
      }
    }

    return removeNode(parent, index)
  }

  const evalCondition = (expr: string): boolean => {
    try {
      const fn = compile(expr)
      const data = convertRanges(gameData)
      return !!fn(data as any)
    } catch (error) {
      console.error('Error evaluating condition:', error)
      return false
    }
  }

  const resolveIf = (
    node: ContainerDirective,
    evalConditionFn: (expr: string) => boolean = evalCondition
  ): RootContent[] => {
    const children = node.children as RootContent[]
    const expr = getLabel(node) || Object.keys(node.attributes || {})[0] || ''
    let idx = 1
    while (
      idx < children.length &&
      children[idx].type !== 'containerDirective'
    ) {
      idx++
    }
    const content = stripLabel(children.slice(0, idx))
    if (expr && evalConditionFn(expr)) return content
    const next = children[idx] as ContainerDirective | undefined
    if (!next) return []
    if (next.name === 'else') return stripLabel(next.children)
    if (next.name === 'elseif') return resolveIf(next, evalConditionFn)
    return []
  }

  const handleGet: DirectiveHandler = (directive, parent, index) => {
    const expr: string =
      toString(directive) || Object.keys(directive.attributes || {})[0] || ''
    let value: unknown
    try {
      const fn = compile(expr)
      value = fn(gameData)
    } catch {
      value = (gameData as any)[expr]
    }
    if (isRange(value)) {
      value = value.value
    }
    const textNode: MdText = {
      type: 'text',
      value: value == null ? '' : String(value)
    }
    if (parent && typeof index === 'number') {
      parent.children.splice(index, 1, textNode)
      return index
    }
  }

  const handleDefined: DirectiveHandler = (directive, parent, index) => {
    const expr: string =
      toString(directive) || Object.keys(directive.attributes || {})[0] || ''
    let defined = false
    if (expr) {
      try {
        const fn = compile(expr)
        const data = convertRanges(gameData)
        const value = fn(data as any)
        defined = typeof value !== 'undefined'
      } catch {
        defined = typeof (gameData as any)[expr] !== 'undefined'
      }
    }
    const textNode: MdText = {
      type: 'text',
      value: defined ? 'true' : 'false'
    }
    if (parent && typeof index === 'number') {
      parent.children.splice(index, 1, textNode)
      return index
    }
  }

  /**
   * Evaluates a mathematical or JavaScript expression in the context of the current game data.
   * Optionally stores the result in the game data state if a 'key' attribute is provided.
   * Replaces the directive node in the AST with a text node containing the result.
   */
  const handleMath: DirectiveHandler = (directive, parent, index) => {
    const attrs = directive.attributes || {}
    const typedAttrs = attrs as Record<string, unknown>
    let expr = toString(directive).trim()
    if (!expr) {
      if (typeof typedAttrs.expr === 'string') {
        expr = String(typedAttrs.expr)
      } else {
        const first = Object.keys(attrs)[0]
        expr = first && first !== 'key' ? first : ''
      }
    }

    let value: unknown
    try {
      const fn = compile(expr)
      value = fn(gameData)
    } catch (error) {
      console.error('Error evaluating math expression:', expr, error)
      value = ''
    }

    const key =
      typeof typedAttrs.key === 'string'
        ? (typedAttrs.key as string)
        : undefined
    if (typeof key === 'string') {
      setGameData({ [key]: value })
    }

    const textNode: MdText = {
      type: 'text',
      value: value == null ? '' : String(value)
    }
    if (parent && typeof index === 'number') {
      parent.children.splice(index, 1, textNode)
      return index
    }
  }

  const handleRandom: DirectiveHandler = (directive, parent, index) => {
    const attrs = directive.attributes || {}
    const key = ensureKey((attrs as Record<string, unknown>).key, parent, index)
    if (!key) return index

    let value: unknown

    const optionsAttr =
      (attrs as Record<string, unknown>).options ??
      (attrs as Record<string, unknown>).from
    if (typeof optionsAttr === 'string') {
      let evaluated: unknown
      try {
        const fn = compile(optionsAttr)
        evaluated = fn(useGameStore.getState().gameData)
      } catch {
        // fall back to string parsing
      }
      if (Array.isArray(evaluated)) {
        value = getRandomItem(evaluated)
      } else {
        const options = optionsAttr
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
        value = getRandomItem(options)
      }
    } else if (Array.isArray(optionsAttr)) {
      value = getRandomItem(optionsAttr as unknown[])
    } else {
      const minRaw = (attrs as Record<string, unknown>).min
      const maxRaw = (attrs as Record<string, unknown>).max
      const min =
        typeof minRaw === 'number'
          ? minRaw
          : minRaw == null
            ? undefined
            : parseFloat(String(minRaw))
      const max =
        typeof maxRaw === 'number'
          ? maxRaw
          : maxRaw == null
            ? undefined
            : parseFloat(String(maxRaw))
      if (
        typeof min === 'number' &&
        !Number.isNaN(min) &&
        typeof max === 'number' &&
        !Number.isNaN(max)
      ) {
        value = getRandomInt(min, max)
      }
    }

    if (value !== undefined) {
      setGameData({ [key]: value })
    }

    const removed = removeNode(parent, index)
    if (typeof removed === 'number') return removed
  }

  const parseItems = (raw: string): unknown[] =>
    raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(item => {
        try {
          const fn = compile(item)
          const evaluated = fn(gameData)
          return evaluated === undefined ? item : evaluated
        } catch {
          return item
        }
      })

  const handlePop: DirectiveHandler = (directive, parent, index) => {
    const attrs = directive.attributes || {}
    const key = ensureKey((attrs as Record<string, unknown>).key, parent, index)
    if (!key) return index

    const arr = Array.isArray(gameData[key])
      ? [...(gameData[key] as unknown[])]
      : []
    const value = arr.pop()

    const store = (attrs as Record<string, unknown>).into
    const updates: Record<string, unknown> = { [key]: arr }
    if (typeof store === 'string' && value !== undefined) {
      updates[store] = value
    }
    setGameData(updates)

    return removeNode(parent, index)
  }

  const handleShift: DirectiveHandler = (directive, parent, index) => {
    const attrs = directive.attributes || {}
    const key = ensureKey((attrs as Record<string, unknown>).key, parent, index)
    if (!key) return index

    const arr = Array.isArray(gameData[key])
      ? [...(gameData[key] as unknown[])]
      : []
    const value = arr.shift()

    const store = (attrs as Record<string, unknown>).into
    const updates: Record<string, unknown> = { [key]: arr }
    if (typeof store === 'string' && value !== undefined) {
      updates[store] = value
    }
    setGameData(updates)

    return removeNode(parent, index)
  }

  const handlePush: DirectiveHandler = (directive, parent, index) => {
    const attrs = directive.attributes || {}
    const key = ensureKey((attrs as Record<string, unknown>).key, parent, index)
    if (!key) return index

    const raw = (attrs as Record<string, unknown>).value
    const values = typeof raw === 'string' ? parseItems(raw) : []
    if (values.length > 0) {
      const arr = Array.isArray(gameData[key])
        ? [...(gameData[key] as unknown[])]
        : []
      arr.push(...values)
      setGameData({ [key]: arr })
    }

    return removeNode(parent, index)
  }

  const handleUnshift: DirectiveHandler = (directive, parent, index) => {
    const attrs = directive.attributes || {}
    const key = ensureKey((attrs as Record<string, unknown>).key, parent, index)
    if (!key) return index

    const raw = (attrs as Record<string, unknown>).value
    const values = typeof raw === 'string' ? parseItems(raw) : []
    if (values.length > 0) {
      const arr = Array.isArray(gameData[key])
        ? [...(gameData[key] as unknown[])]
        : []
      arr.unshift(...values)
      setGameData({ [key]: arr })
    }

    return removeNode(parent, index)
  }

  const handleConcat: DirectiveHandler = (directive, parent, index) => {
    const attrs = directive.attributes || {}
    const key = ensureKey((attrs as Record<string, unknown>).key, parent, index)
    if (!key) return index

    const raw = (attrs as Record<string, unknown>).value
    const values = typeof raw === 'string' ? parseItems(raw) : []
    if (values.length > 0) {
      const arr = Array.isArray(gameData[key])
        ? [...(gameData[key] as unknown[])]
        : []
      const result = arr.concat(...values)
      setGameData({ [key]: result })
    }

    return removeNode(parent, index)
  }

  const handleIncrement = (
    directive: DirectiveNode,
    parent: Parent | undefined,
    index: number | undefined,
    sign = 1
  ): DirectiveHandlerResult => {
    const attrs = directive.attributes || {}
    const key = ensureKey((attrs as Record<string, unknown>).key, parent, index)
    if (!key) return index
    const amountRaw = (attrs as Record<string, unknown>).amount

    let amount: number = 1
    if (typeof amountRaw === 'number') {
      amount = amountRaw
    } else if (typeof amountRaw === 'string') {
      let evaluated: unknown = amountRaw
      try {
        const fn = compile(amountRaw)
        evaluated = fn(gameData)
      } catch {
        // ignore
      }
      amount =
        typeof evaluated === 'number'
          ? evaluated
          : parseNumericValue(evaluated, 1)
    }

    amount *= sign

    const current = gameData[key]
    if (isRange(current)) {
      setGameData({
        [key]: {
          ...current,
          value: clamp(current.value + amount, current.lower, current.upper)
        }
      })
    } else {
      const base = parseNumericValue(current, 0)
      setGameData({ [key]: base + amount })
    }

    const removed = removeNode(parent, index)
    if (typeof removed === 'number') return removed
  }

  const handleUnset: DirectiveHandler = (directive, parent, index) => {
    const attrs = directive.attributes || {}
    const key = ensureKey(
      (attrs as Record<string, unknown>).key ?? toString(directive),
      parent,
      index
    )
    if (!key) return index

    unsetGameData(key)

    return removeNode(parent, index)
  }

  const handleIf: DirectiveHandler = (directive, parent, index) => {
    if (!parent || typeof index !== 'number') return
    const ifDirective = directive as ContainerDirective
    const replacement = resolveIf(ifDirective, evalCondition)
    parent.children.splice(index, 1, ...replacement)
    return [SKIP, index]
  }

  const handleOnce: DirectiveHandler = (directive, parent, index) => {
    if (!parent || typeof index !== 'number') return
    const container = directive as ContainerDirective
    const attrs = container.attributes || {}
    const key = ensureKey(
      (attrs as Record<string, unknown>).key ??
        (getLabel(container) || Object.keys(attrs)[0]),
      parent,
      index
    )
    if (!key) return [SKIP, index]
    if (onceKeys[key]) {
      return removeNode(parent, index)
    }
    markOnce(key)
    const content = stripLabel(container.children as RootContent[])
    parent.children.splice(index, 1, ...content)
    return [SKIP, index]
  }

  const handleOnEnter: DirectiveHandler = (directive, parent, index) => {
    if (!parent || typeof index !== 'number') return
    const container = directive as ContainerDirective
    const content = stripLabel(container.children as RootContent[])
    runBlock(content)
    return removeNode(parent, index)
  }

  const handleOnExit: DirectiveHandler = (directive, parent, index) => {
    if (!parent || typeof index !== 'number') return
    const container = directive as ContainerDirective
    const content = stripLabel(container.children as RootContent[])
    exitHandlers.current.push(content)
    return removeNode(parent, index)
  }

  const handleOnChange: DirectiveHandler = (directive, parent, index) => {
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const key = ensureKey(attrs.key, parent, index)
    if (!key) return index
    const container = directive as ContainerDirective
    const content = stripLabel(container.children as RootContent[])
    const unsub = useGameStore.subscribe(
      state => (state.gameData as Record<string, unknown>)[key],
      () => {
        runBlock(content)
      }
    )
    changeSubscriptions.current.push(unsub)
    return removeNode(parent, index)
  }

  const handleLang: DirectiveHandler = (directive, parent, index) => {
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const locale = typeof attrs.locale === 'string' ? attrs.locale : undefined
    if (
      locale &&
      i18next.isInitialized &&
      i18next.resolvedLanguage !== locale
    ) {
      void i18next.changeLanguage(locale)
    }
    return removeNode(parent, index)
  }

  const handleTranslations: DirectiveHandler = (directive, parent, index) => {
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const ns = typeof attrs.ns === 'string' ? attrs.ns : 'translation'
    const locale =
      typeof attrs.locale === 'string'
        ? attrs.locale
        : i18next.resolvedLanguage || i18next.language
    let resources: Record<string, unknown> = {}
    if (typeof attrs.data === 'string') {
      try {
        resources = JSON.parse(attrs.data)
      } catch {
        // ignore
      }
    } else {
      for (const [k, v] of Object.entries(attrs)) {
        if (k === 'ns' || k === 'locale') continue
        resources[k] = v
      }
    }
    if (!i18next.hasResourceBundle(locale, ns)) {
      i18next.addResourceBundle(locale, ns, {}, true, true)
    }
    if (Object.keys(resources).length) {
      for (const [k, v] of Object.entries(resources)) {
        i18next.addResource(locale, ns, k, v as string)
      }
    }
    return removeNode(parent, index)
  }

  const handleTranslate: DirectiveHandler = (directive, parent, index) => {
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const key =
      typeof attrs.key === 'string' ? attrs.key : toString(directive).trim()
    if (!key) return removeNode(parent, index)
    const options: Record<string, unknown> = {}
    if (typeof attrs.ns === 'string') options.ns = attrs.ns
    if (attrs.count !== undefined) {
      const n =
        typeof attrs.count === 'number'
          ? attrs.count
          : parseFloat(String(attrs.count))
      if (!Number.isNaN(n)) options.count = n
    }
    const text = i18next.t(key, options)
    if (parent && typeof index === 'number') {
      parent.children.splice(index, 1, { type: 'text', value: text })
      let idx = index
      const prev = parent.children[idx - 1] as MdText | undefined
      if (prev && prev.type === 'text') {
        prev.value += (parent.children[idx] as MdText).value
        parent.children.splice(idx, 1)
        idx--
      }
      const next = parent.children[idx + 1] as MdText | undefined
      if (next && next.type === 'text') {
        ;(parent.children[idx] as MdText).value += next.value
        parent.children.splice(idx + 1, 1)
      }
      return idx
    }
  }

  const handleGoto: DirectiveHandler = (directive, parent, index) => {
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const target =
      typeof attrs.pid === 'string'
        ? attrs.pid
        : typeof attrs.name === 'string'
          ? attrs.name
          : toString(directive).trim() || Object.keys(attrs)[0] || ''
    if (target) {
      const passage = /^\d+$/.test(target)
        ? getPassageById(target)
        : getPassageByName(target)
      if (passage) {
        setCurrentPassage(target)
      } else {
        const msg = `Passage not found: ${target}`
        console.error(msg)
        addError(msg)
      }
    }
    return removeNode(parent, index)
  }

  const handleSave: DirectiveHandler = (directive, parent, index) => {
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const key = typeof attrs.key === 'string' ? attrs.key : 'campfire.save'
    setLoading(true)
    try {
      if (typeof localStorage !== 'undefined') {
        const { gameData, lockedKeys, onceKeys, checkpoints } =
          useGameStore.getState()
        const data = {
          gameData: { ...(gameData as Record<string, unknown>) },
          lockedKeys: { ...lockedKeys },
          onceKeys: { ...onceKeys },
          checkpoints: { ...checkpoints },
          currentPassageId
        }
        localStorage.setItem(key, JSON.stringify(data))
      }
    } catch (error) {
      console.error('Error saving game state:', error)
      addError('Failed to save game state')
    } finally {
      setLoading(false)
    }
    return removeNode(parent, index)
  }

  const handleLoad: DirectiveHandler = (directive, parent, index) => {
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const key = typeof attrs.key === 'string' ? attrs.key : 'campfire.save'
    setLoading(true)
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(key)
        if (raw) {
          const data = JSON.parse(raw) as {
            gameData?: Record<string, unknown>
            lockedKeys?: Record<string, true>
            onceKeys?: Record<string, true>
            checkpoints?: Record<string, Checkpoint<Record<string, unknown>>>
            currentPassageId?: string
          }
          useGameStore.setState({
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

  const handleClearSave: DirectiveHandler = (directive, parent, index) => {
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const key = typeof attrs.key === 'string' ? attrs.key : 'campfire.save'
    setLoading(true)
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key)
      }
    } catch (error) {
      console.error('Error clearing saved game state:', error)
      addError('Failed to clear saved game state')
    } finally {
      setLoading(false)
    }
    return removeNode(parent, index)
  }

  const handleCheckpoint: DirectiveHandler = (directive, parent, index) => {
    if (lastPassageIdRef.current !== currentPassageId) {
      resetCheckpointState()
    }
    if (includeDepth > 0) return removeNode(parent, index)
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const id = ensureKey(attrs.id, parent, index)
    if (!id) return index
    if (checkpointErrorRef.current) {
      return removeNode(parent, index)
    }
    if (checkpointIdRef.current) {
      removeCheckpoint(checkpointIdRef.current)
      checkpointIdRef.current = null
      checkpointErrorRef.current = true
      const msg = 'Multiple checkpoints in a single passage are not allowed'
      console.error(msg)
      addError(msg)
      return removeNode(parent, index)
    }
    checkpointIdRef.current = id
    const label =
      typeof attrs.label === 'string' ? i18next.t(attrs.label) : undefined
    saveCheckpoint(id, {
      gameData: { ...(gameData as Record<string, unknown>) },
      lockedKeys: { ...lockedKeys },
      onceKeys: { ...onceKeys },
      currentPassageId,
      label
    })
    return removeNode(parent, index)
  }

  const handleRestore: DirectiveHandler = (directive, parent, index) => {
    if (includeDepth > 0) return removeNode(parent, index)
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const id = typeof attrs.id === 'string' ? attrs.id : undefined
    const cp = restoreCheckpointFn(id)
    if (cp?.currentPassageId) {
      setCurrentPassage(cp.currentPassageId)
    }
    return removeNode(parent, index)
  }

  const handleClearCheckpoint: DirectiveHandler = (
    directive,
    parent,
    index
  ) => {
    if (includeDepth > 0) return removeNode(parent, index)
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const id = typeof attrs.id === 'string' ? attrs.id : undefined
    if (id) {
      removeCheckpoint(id)
    } else {
      useGameStore.setState({ checkpoints: {} })
    }
    return removeNode(parent, index)
  }

  const handleClearErrors: DirectiveHandler = (directive, parent, index) => {
    clearErrors()
    return removeNode(parent, index)
  }

  const handleInclude: DirectiveHandler = (directive, parent, index) => {
    const target =
      toString(directive).trim() ||
      Object.keys(directive.attributes || {})[0] ||
      ''

    if (!parent || typeof index !== 'number' || !target) {
      return removeNode(parent, index)
    }

    if (includeDepth >= MAX_INCLUDE_DEPTH) {
      console.warn('Max include depth reached')
      return removeNode(parent, index)
    }

    const passage = /^\d+$/.test(target)
      ? getPassageById(target)
      : getPassageByName(target)

    if (!passage) return removeNode(parent, index)

    const text = passage.children
      .map((child: ElementContent) =>
        child.type === 'text' ? (child as HastText).value : ''
      )
      .join('')

    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkDirective)
      .use(remarkCampfire, { handlers: handlersRef.current })

    includeDepth++
    const tree = processor.parse(text)
    processor.runSync(tree)
    includeDepth--

    parent.children.splice(index, 1, ...(tree.children as RootContent[]))
    return [SKIP, index]
  }

  return useMemo(() => {
    // noinspection JSUnusedGlobalSymbols
    const handlers = {
      set: (d: DirectiveNode, p: Parent | undefined, i: number | undefined) =>
        handleSet(d, p, i, false),
      setOnce: (
        d: DirectiveNode,
        p: Parent | undefined,
        i: number | undefined
      ) => handleSet(d, p, i, true),
      array: (d: DirectiveNode, p: Parent | undefined, i: number | undefined) =>
        handleArray(d, p, i, false),
      arrayOnce: (
        d: DirectiveNode,
        p: Parent | undefined,
        i: number | undefined
      ) => handleArray(d, p, i, true),
      get: handleGet,
      defined: handleDefined,
      math: handleMath,
      random: handleRandom,
      pop: handlePop,
      push: handlePush,
      shift: handleShift,
      unshift: handleUnshift,
      concat: handleConcat,
      increment: (
        d: DirectiveNode,
        p: Parent | undefined,
        i: number | undefined
      ) => handleIncrement(d, p, i, 1),
      decrement: (
        d: DirectiveNode,
        p: Parent | undefined,
        i: number | undefined
      ) => handleIncrement(d, p, i, -1),
      unset: handleUnset,
      if: handleIf,
      once: handleOnce,
      onEnter: handleOnEnter,
      onExit: handleOnExit,
      onChange: handleOnChange,
      lang: handleLang,
      include: handleInclude,
      goto: handleGoto,
      save: handleSave,
      load: handleLoad,
      clearSave: handleClearSave,
      checkpoint: handleCheckpoint,
      clearCheckpoint: handleClearCheckpoint,
      restore: handleRestore,
      clearErrors: handleClearErrors,
      translations: handleTranslations,
      t: handleTranslate
    }
    handlersRef.current = handlers
    return handlers
  }, [])
}
