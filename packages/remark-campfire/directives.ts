import { SKIP } from 'unist-util-visit'
import { compile } from 'expression-eval'
import { toString } from 'mdast-util-to-string'
import type { Text, Parent } from 'mdast'
import type { Node as UnistNode } from 'unist'
import type { ContainerDirective } from 'mdast-util-directive'
import { useGameStore } from '@/packages/use-game-store'
import { resolveIf, isRange, clamp } from './helpers'
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
            const obj = JSON.parse(value)
            const lower =
              typeof obj.lower === 'number'
                ? obj.lower
                : parseFloat(String(obj.lower))
            const upper =
              typeof obj.upper === 'number'
                ? obj.upper
                : parseFloat(String(obj.upper))
            const valRaw = obj.value ?? lower
            const val =
              typeof valRaw === 'number' ? valRaw : parseFloat(String(valRaw))
            return {
              lower: Number.isNaN(lower) ? 0 : lower,
              upper: Number.isNaN(upper) ? 0 : upper,
              value: clamp(
                Number.isNaN(val) ? 0 : val,
                Number.isNaN(lower) ? 0 : lower,
                Number.isNaN(upper) ? 0 : upper
              )
            } as RangeValue
          } catch {
            return { lower: 0, upper: 0, value: 0 }
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
          if (isRange(current) && typeof parsed === 'number') {
            safe[key] = {
              ...current,
              value: clamp(parsed, current.lower, current.upper)
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
  } else if (directive.name === 'if') {
    if (!parent || typeof index !== 'number') return
    const ifDirective = directive as ContainerDirective
    const replacement = resolveIf(ifDirective)
    parent.children.splice(index, 1, ...replacement)
    return [SKIP, index]
  }

  // all directive types handled above
}
