import { evalExpression, QUOTE_PATTERN } from '@campfire/utils/core'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import remarkCampfire, {
  remarkCampfireIndentation,
  type DirectiveHandler
} from '@campfire/remark-campfire'
import { toString } from 'mdast-util-to-string'
import type { Parent, Root, RootContent, Code, Paragraph } from 'mdast'
import type {
  ContainerDirective,
  LeafDirective,
  TextDirective
} from 'mdast-util-directive'
import type { Node } from 'unist'
import type { RangeValue } from '@campfire/utils/math'

/**
 * Shared remark parser for expanding indented code blocks.
 */
const directiveParser = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkDirective)
  .freeze()

export {
  clamp,
  getRandomInt,
  getRandomItem,
  parseNumericValue,
  parseRange
} from '@campfire/utils/math'
export type { RangeValue } from '@campfire/utils/math'

export type DirectiveNode = ContainerDirective | LeafDirective | TextDirective

interface ParagraphLabel extends Paragraph {
  data: { directiveLabel: true }
}

/**
 * Checks if a node is a paragraph node with a directive label.
 *
 * @param node - The node to check.
 * @returns True if the node is a ParagraphLabel, false otherwise.
 */
const isLabelParagraph = (node: Node | undefined): node is ParagraphLabel =>
  !!node &&
  node.type === 'paragraph' &&
  !!(node as Paragraph).data?.directiveLabel

/**
 * Gets the label string from the first child of a container directive node if it is a label paragraph.
 *
 * @param node - The container directive node to extract the label from.
 * @returns The label string if present, otherwise an empty string.
 */
export const getLabel = (node: ContainerDirective): string => {
  const first = node.children[0]
  if (isLabelParagraph(first)) {
    return toString(first)
  }
  return ''
}

/**
 * Removes the label paragraph from the beginning of the children array, if present,
 * while preserving any whitespace that follows the label. This ensures blank lines
 * inside container directives remain intact.
 *
 * @param children - The array of RootContent nodes.
 * @returns The children array without the label paragraph at the start.
 */
export const stripLabel = (children: RootContent[]): RootContent[] => {
  if (children.length && isLabelParagraph(children[0])) {
    return children.slice(1)
  }
  return children
}

/**
 * Checks if the provided value is a RangeValue object by verifying it has the required properties.
 *
 * @param v - The value to check.
 * @returns True if the value is a RangeValue object with numeric min, max, and value properties.
 */
export const isRange = (v: unknown): v is RangeValue => {
  if (!v || typeof v !== 'object') return false
  const obj = v as Record<string, unknown>
  return (
    typeof obj.min === 'number' &&
    typeof obj.max === 'number' &&
    typeof obj.value === 'number'
  )
}

/**
 * Recursively converts any RangeValue objects in the input to their numeric value.
 * If the input is an array or object, applies the conversion to all elements or properties.
 *
 * @param obj - The input object, array, or value to convert.
 * @returns The converted value(s) with RangeValue replaced by their numeric value.
 */
export const convertRanges = (obj: unknown): unknown => {
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

/**
 * Removes a node from its parent at the specified index.
 *
 * @param parent - The parent node containing the children array.
 * @param index - The index of the child to remove.
 * @returns The index if removal was successful, otherwise undefined.
 */
export const removeNode = (
  parent: Parent | undefined,
  index: number | undefined
): number | undefined => {
  if (parent && typeof index === 'number') {
    parent.children.splice(index, 1)
    return index
  }
  return undefined
}

/**
 * Ensures a valid string key is returned. If not, removes the node from its parent.
 *
 * @param raw - The raw key value to check.
 * @param parent - The parent node containing the children array.
 * @param index - The index of the child to remove if key is invalid.
 * @returns The string key if valid, otherwise undefined.
 */
export const ensureKey = (
  raw: unknown,
  parent: Parent | undefined,
  index: number | undefined
): string | undefined => {
  if (typeof raw === 'string') return raw
  removeNode(parent, index)
  return undefined
}

export interface AttributeSpec<T = unknown> {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required?: boolean
  default?: T
  expression?: boolean
}

export type AttributeSchema = Record<string, AttributeSpec<any>>

type TypeFromSpec<S extends AttributeSpec<any>> = S['type'] extends 'string'
  ? string
  : S['type'] extends 'number'
    ? number
    : S['type'] extends 'boolean'
      ? boolean
      : S['type'] extends 'object'
        ? Record<string, unknown>
        : S['type'] extends 'array'
          ? unknown[]
          : unknown

export type ExtractedAttrs<S extends AttributeSchema> = {
  [K in keyof S as S[K]['required'] extends true ? K : never]: TypeFromSpec<
    S[K]
  >
} & {
  [K in keyof S as S[K]['required'] extends true ? never : K]?: TypeFromSpec<
    S[K]
  >
}

interface ExtractOptions<S extends AttributeSchema> {
  state?: Record<string, unknown>
  keyAttr?: keyof S
  label?: boolean
}

export interface ExtractResult<S extends AttributeSchema> {
  attrs: ExtractedAttrs<S>
  key?: string
  label?: string
  valid: boolean
  errors: string[]
}

/**
 * Parses an attribute value according to its specification.
 *
 * @param raw - Raw attribute value from the directive.
 * @param spec - Attribute specification describing type and flags.
 * @param state - Optional expression scope used for evaluations.
 * @returns The parsed value or undefined when parsing fails.
 */
export const parseAttributeValue = (
  raw: unknown,
  spec: AttributeSpec,
  state: Record<string, unknown> = {}
): unknown => {
  const evalExpr = (expr: string): unknown => {
    try {
      return evalExpression(expr, state)
    } catch {
      return undefined
    }
  }
  if (raw == null) return undefined
  switch (spec.type) {
    case 'string': {
      if (typeof raw === 'string') {
        const m = raw.match(QUOTE_PATTERN)
        if (m) return m[2]
        if (spec.expression === false) return raw
        const evaluated = evalExpr(raw)
        if (typeof evaluated === 'string') return evaluated
        return evaluated != null ? String(evaluated) : raw
      }
      return String(raw)
    }
    case 'number': {
      if (typeof raw === 'number') return raw
      const expr = typeof raw === 'string' ? raw : String(raw)
      const evaluated = spec.expression === false ? expr : evalExpr(expr)
      const num =
        typeof evaluated === 'number'
          ? evaluated
          : parseFloat(String(evaluated))
      return Number.isNaN(num) ? undefined : num
    }
    case 'boolean': {
      if (typeof raw === 'boolean') return raw
      if (typeof raw === 'string') {
        if (spec.expression === false) return raw === 'true'
        const evaluated = evalExpr(raw)
        return typeof evaluated === 'boolean' ? evaluated : raw === 'true'
      }
      return undefined
    }
    case 'object': {
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw
      if (typeof raw === 'string') {
        const evaluated = spec.expression === false ? undefined : evalExpr(raw)
        if (
          evaluated &&
          typeof evaluated === 'object' &&
          !Array.isArray(evaluated)
        )
          return evaluated
        return parseObjectLiteral(raw, state)
      }
      return undefined
    }
    case 'array': {
      if (Array.isArray(raw)) return raw
      if (typeof raw === 'string') {
        const evaluated = spec.expression === false ? undefined : evalExpr(raw)
        if (Array.isArray(evaluated)) return evaluated
        try {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) return parsed
        } catch {
          return raw
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
        }
      }
      return undefined
    }
    default:
      return raw
  }
}

/**
 * Validates that a required attribute has a value, recording an error when
 * missing.
 *
 * @param directive - Name of the directive being processed.
 * @param name - Attribute name.
 * @param spec - Attribute specification.
 * @param value - Parsed attribute value.
 * @param errors - Collection to record validation errors.
 * @returns True if the attribute is present or optional.
 */
const validateRequiredAttribute = (
  directive: string,
  name: string,
  spec: AttributeSpec,
  value: unknown,
  errors: string[]
): boolean => {
  if (typeof value === 'undefined') {
    if (spec.required)
      errors.push(
        `Directive "${directive}" missing required attribute "${name}"`
      )
    return false
  }
  return true
}

/**
 * Processes a key attribute, ensuring uniqueness and recording errors.
 *
 * @param value - Parsed value of the key attribute.
 * @param name - Name of the key attribute.
 * @param directive - Name of the directive being processed.
 * @param parent - Parent node used when removing duplicates.
 * @param index - Index of the directive within its parent.
 * @param errors - Collection to record validation errors.
 * @returns The ensured key value.
 */
const processKeyAttribute = (
  value: unknown,
  name: string,
  directive: string,
  parent: Parent | undefined,
  index: number | undefined,
  errors: string[]
): string | undefined => {
  const key = ensureKey(value, parent, index)
  if (!key)
    errors.push(
      `Directive "${directive}" missing required key attribute "${name}"`
    )
  return key
}

/**
 * Extracts and validates directive attributes based on a schema.
 *
 * @param directive - Directive node containing raw attributes.
 * @param parent - Parent node used when removing invalid directives.
 * @param index - Index of the directive in its parent.
 * @param schema - Specification describing expected attributes.
 * @param options - Extraction options such as state and key handling.
 * @returns Parsed attributes and validation details.
 */
export const extractAttributes = <S extends AttributeSchema>(
  directive: DirectiveNode,
  parent: Parent | undefined,
  index: number | undefined,
  schema: S,
  options: ExtractOptions<S> = {}
): ExtractResult<S> => {
  const attrs = (directive.attributes || {}) as Record<string, unknown>
  const processed: Record<string, unknown> = {}
  const errors: string[] = []
  const { state = {}, keyAttr, label: includeLabel } = options

  let key: string | undefined

  for (const [name, spec] of Object.entries(schema) as [
    keyof S,
    AttributeSpec
  ][]) {
    const raw = attrs[name as string]
    let value = parseAttributeValue(raw, spec, state)
    if (typeof value === 'undefined' && typeof spec.default !== 'undefined') {
      value = spec.default
    }
    if (name === keyAttr) {
      key = processKeyAttribute(
        value,
        String(name),
        directive.name,
        parent,
        index,
        errors
      )
      if (!key)
        return {
          attrs: processed as ExtractedAttrs<S>,
          key,
          valid: false,
          errors
        }
    } else if (
      validateRequiredAttribute(
        directive.name,
        String(name),
        spec,
        value,
        errors
      )
    ) {
      processed[name as string] = value as unknown
    }
  }

  let label: string | undefined
  if (includeLabel && 'children' in directive)
    label = getLabel(directive as ContainerDirective)

  return {
    attrs: processed as ExtractedAttrs<S>,
    key,
    label,
    valid: errors.length === 0,
    errors
  }
}

/**
 * Parses a string containing an object literal. Supports both JSON-style
 * objects and colon-delimited forms without surrounding braces.
 *
 * @param value - Raw string to parse.
 * @param state - Optional context for nested value parsing.
 * @returns Parsed object or undefined when parsing fails.
 */
export const parseObjectLiteral = (
  value: string,
  state: Record<string, unknown> = {}
): Record<string, unknown> | undefined => {
  const trimmed = value.trim()
  const wrapped = trimmed.startsWith('{') ? trimmed : `{${trimmed}}`
  try {
    const json = JSON.parse(wrapped)
    if (json && typeof json === 'object' && !Array.isArray(json)) return json
  } catch {
    /* fallback to manual parsing */
  }
  const parsed = parseTypedValue(wrapped, state, { eval: false })
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : undefined
}

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
  data: Record<string, unknown> = {},
  opts: { eval?: boolean } = {}
): unknown => {
  const { eval: shouldEval = true } = opts
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
      const parsed = parseTypedValue(value, data, opts)
      if (typeof parsed !== 'undefined') obj[key] = parsed
    }
    return obj
  }
  const num = Number(trimmed)
  if (!Number.isNaN(num)) return num
  if (!shouldEval) return trimmed
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
      const root = directiveParser().parse((node as Code).value) as Root
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

/**
 * Determines whether a value is a valid `RootContent` node.
 *
 * @param value - The value to examine.
 * @returns True if the value is `RootContent`.
 */
const isRootContentNode = (value: unknown): value is RootContent =>
  typeof value === 'object' && value !== null && 'type' in value

/**
 * Processes directive AST nodes through the Campfire remark pipeline.
 *
 * @param nodes - Nodes to process.
 * @param handlers - Optional directive handlers to apply.
 * @returns The processed array of nodes.
 */
export const runDirectiveBlock = (
  nodes: RootContent[],
  handlers: Record<string, DirectiveHandler> = {}
): RootContent[] => {
  const root: Root = { type: 'root', children: nodes }
  unified()
    .use(remarkCampfireIndentation)
    .use(remarkCampfire, { handlers })
    .runSync(root)
  const { children } = root
  if (!(children as unknown[]).every(isRootContentNode)) {
    throw new TypeError(
      'Processed directive nodes contain unexpected node types'
    )
  }
  return children
}
