import { evalExpression } from '@campfire/utils/evalExpression'
import { QUOTE_PATTERN } from '@campfire/utils/quote'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import { toString } from 'mdast-util-to-string'
import type { Parent, Root, RootContent, Code } from 'mdast'
import type { DirectiveNode } from '@campfire/remark-campfire/helpers'
import { ensureKey, removeNode } from '@campfire/remark-campfire/helpers'

/**
 * Parses a raw string into a typed value. Supports quoted strings, booleans,
 * numbers, object literals and expression evaluation against provided data.
 *
 * @param raw - Raw value string to parse.
 * @param data - Optional context for expression evaluation.
 * @returns Parsed value or undefined when empty.
 */
export const parseTypedValue = (
  raw: string,
  data: Record<string, unknown> = {}
): unknown => {
  const trimmed = raw.trim()
  if (!trimmed) return undefined
  const quoted = trimmed.match(QUOTE_PATTERN)
  if (quoted) return quoted[2]
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    const inner = trimmed.slice(1, -1)
    const obj: Record<string, unknown> = {}
    for (const part of inner.split(',')) {
      const colon = part.indexOf(':')
      if (colon === -1) continue
      const key = part.slice(0, colon).trim()
      if (!key) continue
      const value = part.slice(colon + 1)
      const parsed = parseTypedValue(value, data)
      if (typeof parsed !== 'undefined') obj[key] = parsed
    }
    return obj
  }
  const num = Number(trimmed)
  if (!Number.isNaN(num)) return num
  try {
    return evalExpression(trimmed, data)
  } catch {
    return (data as Record<string, unknown>)[trimmed]
  }
}

/**
 * Extracts a `key=value` pair from a directive node.
 *
 * @param directive - Directive being processed.
 * @param parent - Parent node containing the directive.
 * @param index - Index of the directive within the parent.
 * @param onError - Callback for reporting errors.
 * @returns The extracted key and raw value, or undefined on failure.
 */
export const extractKeyValue = (
  directive: DirectiveNode,
  parent: Parent | undefined,
  index: number | undefined,
  onError: (msg: string) => void
): { key: string; valueRaw: string } | undefined => {
  const label = (
    (directive as { label?: string }).label ?? toString(directive)
  ).trim()
  const eq = label.indexOf('=')
  if (eq === -1) {
    const name = (directive as { name?: string }).name ?? 'unknown'
    const msg = `Malformed ${name} directive: ${label}`
    console.error(msg)
    onError(msg)
    return undefined
  }
  const keyRaw = label.slice(0, eq).trim()
  const key = ensureKey(keyRaw, parent, index)
  if (!key) return undefined
  const valueRaw = label.slice(eq + 1).trim()
  return { key, valueRaw }
}

/**
 * Replaces a directive with new nodes while preserving its indentation.
 *
 * @param directive - Directive being replaced.
 * @param parent - Parent of the directive.
 * @param index - Index of the directive within the parent.
 * @param nodes - Nodes to insert.
 * @returns Index of the first inserted node.
 */
export const replaceWithIndentation = (
  directive: DirectiveNode,
  parent: Parent,
  index: number,
  nodes: RootContent[]
): number => {
  const indent = (directive.data as { indentation?: string } | undefined)
    ?.indentation
  const insert = indent
    ? ([{ type: 'text', value: indent }, ...nodes] as RootContent[])
    : nodes
  parent.children.splice(index, 1, ...insert)
  return index + (indent ? 1 : 0)
}

/**
 * Recursively expands indented code blocks into markdown nodes.
 *
 * @param nodes - Nodes to expand.
 * @param depth - Current recursion depth.
 * @param maxDepth - Maximum allowed depth to prevent infinite recursion.
 * @returns Expanded nodes.
 */
export const expandIndentedCode = (
  nodes: RootContent[],
  depth = 0,
  maxDepth = 20
): RootContent[] => {
  if (depth >= maxDepth) return nodes
  return nodes.flatMap(node => {
    if (node.type === 'code' && !node.lang) {
      const root = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkDirective)
        .parse((node as Code).value) as Root
      return expandIndentedCode(
        root.children as RootContent[],
        depth + 1,
        maxDepth
      )
    }
    if ('children' in node && Array.isArray((node as Parent).children)) {
      ;(node as Parent).children = expandIndentedCode(
        (node as Parent).children as RootContent[],
        depth + 1,
        maxDepth
      )
    }
    return [node]
  })
}

/**
 * Applies a key/value directive by parsing the value and assigning it using the
 * provided setter.
 *
 * @param directive - Directive node to process.
 * @param parent - Parent node.
 * @param index - Index of directive within parent.
 * @param opts - Options controlling parsing and assignment.
 * @returns The index of the removed node, if applicable.
 */
export const applyKeyValue = <T>(
  directive: DirectiveNode,
  parent: Parent | undefined,
  index: number | undefined,
  opts: {
    parse: (raw: string, key: string) => T
    setValue: (key: string, value: T, options?: any) => void
    onError: (msg: string) => void
    lock?: boolean
  }
) => {
  const parsed = extractKeyValue(directive, parent, index, opts.onError)
  if (!parsed) return index
  const { key, valueRaw } = parsed
  const value = opts.parse(valueRaw, key)
  opts.setValue(key, value, { lock: opts.lock })
  const removed = removeNode(parent, index)
  if (typeof removed === 'number') return removed
  return index
}
