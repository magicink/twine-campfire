import { SKIP } from 'unist-util-visit'
import { compile } from 'expression-eval'
import { toString } from 'mdast-util-to-string'
import type { Text, Parent } from 'mdast'
import type { Node as UnistNode } from 'unist'
import type { ContainerDirective } from 'mdast-util-directive'
import { useGameStore } from '@/packages/use-game-store'
import { resolveIf, isRange, clamp, parseRange } from './helpers'
import type { RangeValue, DirectiveNode } from './helpers'
export function handleDirective(
  directive: DirectiveNode,
  parent: Parent | undefined,
  index: number | undefined
): number | [typeof SKIP, number] | void {
  if (directive.name === 'set') {
    const typeParam = (toString(directive).trim() || 'string').toLowerCase()
    const attrs = directive.attributes
    const safe: Record<string, unknown> = {}

    const parseValue = (value: string): unknown => {
      switch (typeParam) {
        case 'number': {
          let evaluated: unknown = value
          try {
            const fn = compile(value)
            evaluated = fn(useGameStore.getState().gameData)
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
          const current = useGameStore.getState().gameData[key]
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
      useGameStore.getState().setGameData(safe)
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
      value = fn(useGameStore.getState().gameData)
    } catch {
      value = useGameStore.getState().gameData[expr]
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
    const variableRaw = (attrs as Record<string, unknown>).variable
    if (typeof variableRaw !== 'string') {
      if (parent && typeof index === 'number') {
        parent.children.splice(index, 1)
        return index
      }
      return
    }

    let value: unknown

    const from = (attrs as Record<string, unknown>).from
    if (typeof from === 'string') {
      const options = from
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
      if (options.length > 0) {
        const idx = Math.floor(Math.random() * options.length)
        value = options[idx]
      }
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
        const low = Math.min(min, max)
        const high = Math.max(min, max)
        value = Math.floor(Math.random() * (high - low + 1)) + low
      }
    }

    if (value !== undefined) {
      useGameStore.getState().setGameData({ [variableRaw]: value })
    }

    if (parent && typeof index === 'number') {
      parent.children.splice(index, 1)
      return index
    }
  } else if (directive.name === 'if') {
    if (!parent || typeof index !== 'number') return
    const ifDirective = directive as ContainerDirective
    const replacement = resolveIf(ifDirective)
    parent.children.splice(index, 1, ...replacement)
    return [SKIP, index]
  }

  // all directive types handled above
}
