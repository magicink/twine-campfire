import { useMemo } from 'react'
import { SKIP } from 'unist-util-visit'
import { compile } from 'expression-eval'
import { toString } from 'mdast-util-to-string'
import type { Text, Parent, RootContent, Paragraph } from 'mdast'
import type {
  ContainerDirective,
  LeafDirective,
  TextDirective
} from 'mdast-util-directive'
import type { Node } from 'unist'
import { useGameStore } from '@/packages/use-game-store'

export interface RangeValue {
  lower: number
  upper: number
  value: number
}

export type DirectiveNode = ContainerDirective | LeafDirective | TextDirective

export type DirectiveHandlerResult = number | [typeof SKIP, number] | void

export type DirectiveHandler = (
  directive: DirectiveNode,
  parent: Parent | undefined,
  index: number | undefined
) => DirectiveHandlerResult

const isRange = (v: unknown): v is RangeValue => {
  if (!v || typeof v !== 'object') return false
  const obj = v as Record<string, unknown>
  return (
    typeof obj.lower === 'number' &&
    typeof obj.upper === 'number' &&
    typeof obj.value === 'number'
  )
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max)

const parseNumericValue = (value: unknown, defaultValue = 0): number => {
  if (typeof value === 'number') return value
  const num = parseFloat(String(value))
  return Number.isNaN(num) ? defaultValue : num
}

const parseRange = (input: unknown): RangeValue => {
  let obj: unknown = input
  if (typeof input === 'string') {
    try {
      obj = JSON.parse(input)
    } catch {
      // fall back to numeric parsing below
    }
  }
  if (obj && typeof obj === 'object') {
    const data = obj as Record<string, unknown>
    const lowerRaw = data.lower
    const upperRaw = data.upper
    const lower =
      typeof lowerRaw === 'number' ? lowerRaw : parseFloat(String(lowerRaw))
    const upper =
      typeof upperRaw === 'number' ? upperRaw : parseFloat(String(upperRaw))
    const l = Number.isNaN(lower) ? 0 : lower
    const u = Number.isNaN(upper) ? 0 : upper
    const valRaw = data.value ?? l
    const val = typeof valRaw === 'number' ? valRaw : parseFloat(String(valRaw))
    return {
      lower: l,
      upper: u,
      value: clamp(Number.isNaN(val) ? 0 : val, l, u)
    }
  }
  const n = typeof obj === 'number' ? obj : parseFloat(String(obj))
  const num = Number.isNaN(n) ? 0 : n
  return { lower: 0, upper: num, value: clamp(num, 0, num) }
}

const getRandomInt = (min: number, max: number): number => {
  const low = Math.min(min, max)
  const high = Math.max(min, max)
  return Math.floor(Math.random() * (high - low + 1)) + low
}

const getRandomItem = <T>(items: T[]): T | undefined => {
  if (!items.length) return undefined
  return items[getRandomInt(0, items.length - 1)]
}

interface ParagraphLabel extends Paragraph {
  data: { directiveLabel: true }
}

const isLabelParagraph = (node: Node | undefined): node is ParagraphLabel =>
  !!node &&
  node.type === 'paragraph' &&
  !!(node as Paragraph).data?.directiveLabel

const getLabel = (node: ContainerDirective): string => {
  const first = node.children[0]
  if (isLabelParagraph(first)) {
    return toString(first)
  }
  return ''
}

const stripLabel = (children: RootContent[]): RootContent[] => {
  if (children.length && isLabelParagraph(children[0])) {
    return children.slice(1)
  }
  return children
}

const convertRanges = (obj: unknown): unknown => {
  if (isRange(obj)) return obj.value
  if (Array.isArray(obj)) return obj.map(convertRanges)
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = convertRanges(v)
    }
    return out
  }
  return obj
}

const resolveIf = (
  node: ContainerDirective,
  evalCondition: (expr: string) => boolean
): RootContent[] => {
  const children = node.children as RootContent[]
  const expr = getLabel(node) || Object.keys(node.attributes || {})[0] || ''
  let idx = 1
  while (idx < children.length && children[idx].type !== 'containerDirective') {
    idx++
  }
  const content = stripLabel(children.slice(0, idx))
  if (expr && evalCondition(expr)) return content
  const next = children[idx] as ContainerDirective | undefined
  if (!next) return []
  if (next.name === 'else') return stripLabel(next.children)
  if (next.name === 'elseif') return resolveIf(next, evalCondition)
  return []
}

const removeNode = (
  parent: Parent | undefined,
  index: number | undefined
): number | undefined => {
  if (parent && typeof index === 'number') {
    parent.children.splice(index, 1)
    return index
  }
  return undefined
}

const ensureKey = (
  raw: unknown,
  parent: Parent | undefined,
  index: number | undefined
): string | undefined => {
  if (typeof raw === 'string') return raw
  removeNode(parent, index)
  return undefined
}

export const useDirectiveHandlers = () => {
  const setGameData = useGameStore(state => state.setGameData)
  const unsetGameData = useGameStore(state => state.unsetGameData)
  const lockKey = useGameStore(state => state.lockKey)
  const gameData = useGameStore(state => state.gameData)

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

  const resolve = (node: ContainerDirective): RootContent[] =>
    resolveIf(node, evalCondition)

  const handleDirective: DirectiveHandler = (directive, parent, index) => {
    if (directive.name === 'set' || directive.name === 'setOnce') {
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
            const current = gameData[key as keyof typeof gameData]
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
        setGameData(safe)
        if (directive.name === 'setOnce') {
          for (const key of Object.keys(safe)) {
            lockKey(key)
          }
        }
      }

      if (parent && typeof index === 'number') {
        parent.children.splice(index, 1)
        return index
      }
    } else if (directive.name === 'get') {
      const expr: string =
        toString(directive) || Object.keys(directive.attributes || {})[0] || ''
      let value: unknown
      try {
        const fn = compile(expr)
        value = fn(gameData)
      } catch {
        value = gameData[expr as keyof typeof gameData]
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
    } else if (directive.name === 'random') {
      const attrs = directive.attributes || {}
      const key = ensureKey(
        (attrs as Record<string, unknown>).key,
        parent,
        index
      )
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
    } else if (
      directive.name === 'increment' ||
      directive.name === 'decrement'
    ) {
      const attrs = directive.attributes || {}
      const key = ensureKey(
        (attrs as Record<string, unknown>).key,
        parent,
        index
      )
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

      if (directive.name === 'decrement') {
        amount = -amount
      }

      const current = gameData[key as keyof typeof gameData]
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
    } else if (directive.name === 'unset') {
      const attrs = directive.attributes || {}
      const key = ensureKey(
        (attrs as Record<string, unknown>).key ?? toString(directive),
        parent,
        index
      )
      if (!key) return index

      unsetGameData(key)

      return removeNode(parent, index)
    } else if (directive.name === 'if') {
      if (!parent || typeof index !== 'number') return
      const ifDirective = directive as ContainerDirective
      const replacement = resolveIf(ifDirective, evalCondition)
      parent.children.splice(index, 1, ...replacement)
      return [SKIP, index]
    }

    // all directive types handled above
  }

  return useMemo(
    () => ({
      set: handleDirective,
      setOnce: handleDirective,
      get: handleDirective,
      random: handleDirective,
      increment: handleDirective,
      decrement: handleDirective,
      unset: handleDirective,
      if: handleDirective
    }),
    [handleDirective]
  )
}
