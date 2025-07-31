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

export const isRange = (v: unknown): v is RangeValue =>
  !!v &&
  typeof v === 'object' &&
  'lower' in v &&
  'upper' in v &&
  'value' in v &&
  typeof (v as any).lower === 'number' &&
  typeof (v as any).upper === 'number' &&
  typeof (v as any).value === 'number'

export const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max)

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
