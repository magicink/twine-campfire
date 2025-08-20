import { toString } from 'mdast-util-to-string'
import { evalExpression } from '@campfire/utils/evalExpression'
import { QUOTE_PATTERN } from '@campfire/utils/quote'
import type { Parent, Paragraph, RootContent } from 'mdast'
import type {
  ContainerDirective,
  LeafDirective,
  TextDirective
} from 'mdast-util-directive'
import type { Node } from 'unist'
import type { RangeValue } from '@campfire/utils/math'

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
  const { state = {}, keyAttr, label: includeLabel } = options
  const processed: Record<string, unknown> = {}
  const errors: string[] = []
  let key: string | undefined

  /**
   * Evaluates an expression string against the provided state scope.
   *
   * @param expr - Expression to evaluate.
   * @returns The evaluated result or undefined if evaluation fails.
   */
  const evalExpr = (expr: string): unknown => {
    try {
      return evalExpression(expr, state)
    } catch {
      return undefined
    }
  }

  /**
   * Parses a raw attribute value according to its specification.
   *
   * @param raw - Raw attribute value.
   * @param spec - Attribute specification describing type and flags.
   * @returns The parsed value or undefined if parsing fails.
   */
  const parse = (raw: unknown, spec: AttributeSpec): unknown => {
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
          const evaluated =
            spec.expression === false ? undefined : evalExpr(raw)
          if (
            evaluated &&
            typeof evaluated === 'object' &&
            !Array.isArray(evaluated)
          )
            return evaluated
          try {
            const parsed = JSON.parse(raw)
            return typeof parsed === 'object' && !Array.isArray(parsed)
              ? parsed
              : undefined
          } catch {
            return undefined
          }
        }
        return undefined
      }
      case 'array': {
        if (Array.isArray(raw)) return raw
        if (typeof raw === 'string') {
          const evaluated =
            spec.expression === false ? undefined : evalExpr(raw)
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

  for (const [name, spec] of Object.entries(schema) as [
    keyof S,
    AttributeSpec
  ][]) {
    const raw = attrs[name as string]
    let value = parse(raw, spec)
    if (typeof value === 'undefined' && typeof spec.default !== 'undefined') {
      value = spec.default
    }
    if (name === keyAttr) {
      key = ensureKey(value, parent, index)
      if (!key) {
        errors.push(
          `Directive "${directive.name}" missing required key attribute "${String(name)}"`
        )
        return {
          attrs: processed as ExtractedAttrs<S>,
          key,
          valid: false,
          errors
        }
      }
    } else if (typeof value === 'undefined') {
      if (spec.required)
        errors.push(
          `Directive "${directive.name}" missing required attribute "${String(name)}"`
        )
    } else {
      processed[name as string] = value
    }
  }

  let label: string | undefined
  if (includeLabel && 'children' in directive) {
    label = getLabel(directive as ContainerDirective)
  }

  return {
    attrs: processed as ExtractedAttrs<S>,
    key,
    label,
    valid: errors.length === 0,
    errors
  }
}
