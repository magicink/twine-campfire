import { useMemo } from 'react'
import { SKIP } from 'unist-util-visit'
import { compile } from 'expression-eval'
import { toString } from 'mdast-util-to-string'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import remarkCampfire from '@/packages/remark-campfire'
import type { Text, Parent, RootContent } from 'mdast'
import type { ContainerDirective } from 'mdast-util-directive'
import { useStoryDataStore } from '@/packages/use-story-data-store'
import { useGameStore } from '@/packages/use-game-store'
import {
  isRange,
  clamp,
  parseNumericValue,
  parseRange,
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
  const handleSet = (
    directive: DirectiveNode,
    parent: Parent | undefined,
    index: number | undefined,
    lock = false
  ): DirectiveHandlerResult => {
    const typeParam = (toString(directive).trim() || 'string').toLowerCase()
    const attrs = directive.attributes
    const safe: Record<string, unknown> = {}

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
        case 'range':
          try {
            const parsed = JSON.parse(value)
            if (parsed && typeof parsed === 'object') {
              return parseRange(parsed)
            }
            const num =
              typeof parsed === 'number' ? parsed : parseFloat(String(parsed))
            return Number.isNaN(num) ? 0 : num
          } catch {
            const num = parseFloat(value)
            return Number.isNaN(num) ? 0 : num
          }
        case 'string':
        default:
          return value
      }
    }

    if (attrs && typeof attrs === 'object') {
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

    if (Object.keys(safe).length > 0) {
      const state = useGameStore.getState()
      state.setGameData(safe)
      if (lock) {
        for (const k of Object.keys(safe)) {
          state.lockKey(k)
        }
      }
    }

    if (parent && typeof index === 'number') {
      parent.children.splice(index, 1)
      return index
    }
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
    const textNode: Text = {
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
      const options = optionsAttr
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
      value = getRandomItem(options)
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

  let handlers: Record<string, DirectiveHandler>

  const handleInclude: DirectiveHandler = (directive, parent, index) => {
    const target =
      toString(directive).trim() ||
      Object.keys(directive.attributes || {})[0] ||
      ''

    if (!parent || typeof index !== 'number' || !target) {
      return removeNode(parent, index)
    }

    const store = useStoryDataStore.getState()
    const passage = /^\d+$/.test(target)
      ? store.getPassageById(target)
      : store.getPassageByName(target)

    if (!passage) return removeNode(parent, index)

    const text = passage.children
      .map((child: any) =>
        child.type === 'text' && typeof child.value === 'string'
          ? child.value
          : ''
      )
      .join('')

    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkDirective)
      .use(remarkCampfire, { handlers })

    const tree = processor.parse(text)
    processor.runSync(tree)

    parent.children.splice(index, 1, ...(tree.children as RootContent[]))
    return [SKIP, index]
  }

  return useMemo(() => {
    handlers = {
      set: (d: DirectiveNode, p: Parent | undefined, i: number | undefined) =>
        handleSet(d, p, i, false),
      setOnce: (
        d: DirectiveNode,
        p: Parent | undefined,
        i: number | undefined
      ) => handleSet(d, p, i, true),
      get: handleGet,
      random: handleRandom,
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
      include: handleInclude
    }
    return handlers
  }, [])
}
