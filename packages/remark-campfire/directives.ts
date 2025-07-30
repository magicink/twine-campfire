import { SKIP } from 'unist-util-visit'
import { compile } from 'expression-eval'
import { toString } from 'mdast-util-to-string'
import type { Text, Parent } from 'mdast'
import type { Node as UnistNode } from 'unist'
import type { ContainerDirective } from 'mdast-util-directive'
import { useGameStore } from '@/packages/use-game-store'
import { resolveIf } from './helpers'
import type { DirectiveNode } from './helpers'
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
        case 'string':
        default:
          return value
      }
    }

    if (attrs && typeof attrs === 'object') {
      for (const [key, value] of Object.entries(attrs)) {
        if (typeof value === 'string') {
          safe[key] = parseValue(value)
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
