import { compile } from 'expression-eval'
import { toString } from 'mdast-util-to-string'
import type { Parent, Paragraph, RootContent } from 'mdast'
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

export const isRange = (v: unknown): v is RangeValue => {
  if (!v || typeof v !== 'object') return false
  const obj = v as Record<string, unknown>
  return (
    typeof obj.lower === 'number' &&
    typeof obj.upper === 'number' &&
    typeof obj.value === 'number'
  )
}

export const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max)

export const parseRange = (input: unknown): RangeValue => {
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

export type DirectiveNode = ContainerDirective | LeafDirective | TextDirective

interface ParagraphLabel extends Paragraph {
  data: { directiveLabel: true }
}

const isLabelParagraph = (node: Node | undefined): node is ParagraphLabel =>
  !!node &&
  node.type === 'paragraph' &&
  !!(node as Paragraph).data?.directiveLabel

export const getLabel = (node: ContainerDirective): string => {
  const first = node.children[0]
  if (isLabelParagraph(first)) {
    return toString(first)
  }
  return ''
}

export const stripLabel = (children: RootContent[]): RootContent[] => {
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

export const evalCondition = (expr: string): boolean => {
  try {
    const fn = compile(expr)
    const data = convertRanges(useGameStore.getState().gameData)
    return !!fn(data as any)
  } catch (error) {
    console.error('Error evaluating condition:', error)
    return false
  }
}

export const resolveIf = (node: ContainerDirective): RootContent[] => {
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
  if (next.name === 'elseif') return resolveIf(next)
  return []
}
