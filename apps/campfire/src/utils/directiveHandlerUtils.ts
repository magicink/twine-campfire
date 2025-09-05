import { toString } from 'mdast-util-to-string'
import type { Parent, Paragraph, RootContent, Text as MdText } from 'mdast'
import type { DirectiveNode } from '@campfire/utils/directiveUtils'
import { removeNode } from '@campfire/utils/directiveUtils'
import type { DirectiveHandlerResult } from '@campfire/remark-campfire'
import { interpolateString } from '@campfire/utils/core'
import { DEFAULT_DECK_HEIGHT, DEFAULT_DECK_WIDTH } from '@campfire/constants'

const DIRECTIVE_MARKER = ':::'
const ASPECT_RATIO_THRESHOLD = 100

const interpolateAttr = (
  value: string | undefined,
  data: Record<string, unknown>
): string | undefined =>
  value && value.includes('${') ? interpolateString(value, data) : value

/**
 * Retrieves and interpolates the `className` attribute from a directive.
 *
 * @param attrs - Attribute map from the directive.
 * @param data - Current game data for interpolation.
 * @returns The processed class string, or an empty string when absent.
 */
export const getClassAttr = (
  attrs: Record<string, unknown>,
  data: Record<string, unknown>
): string =>
  interpolateAttr(
    typeof attrs.className === 'string' ? attrs.className : undefined,
    data
  ) || ''

/**
 * Retrieves and interpolates the `style` attribute from a directive.
 *
 * @param attrs - Attribute map from the directive.
 * @param data - Current game data for interpolation.
 * @returns The processed style string, or undefined when absent.
 */
export const getStyleAttr = (
  attrs: Record<string, unknown>,
  data: Record<string, unknown>
): string | undefined =>
  interpolateAttr(
    typeof attrs.style === 'string' ? attrs.style : undefined,
    data
  )

/**
 * Ensures a directive is used in leaf form. Logs an error and removes the node otherwise.
 *
 * @param directive - The directive to validate.
 * @param parent - Parent node containing the directive.
 * @param index - Index of the directive within the parent.
 * @param addError - Callback to record an error message.
 * @returns The index of the removed node when invalid, otherwise undefined.
 */
export const requireLeafDirective = (
  directive: DirectiveNode,
  parent: Parent | undefined,
  index: number | undefined,
  addError: (msg: string) => void
): DirectiveHandlerResult | undefined => {
  if (directive.type === 'leafDirective') return
  const msg = `${directive.name} can only be used as a leaf directive`
  console.error(msg)
  addError(msg)
  return removeNode(parent, index)
}

/**
 * Validates that both `parent` and `index` are provided and returns them when valid.
 *
 * @param parent - Parent node potentially containing the directive.
 * @param index - Index of the directive within the parent node.
 * @returns A tuple of the parent and index when both are valid, otherwise undefined.
 */
export const ensureParentIndex = (
  parent: Parent | undefined,
  index: number | undefined
): [Parent, number] | undefined =>
  parent && typeof index === 'number' ? [parent, index] : undefined

/**
 * Removes a directive marker paragraph or trims marker text from a paragraph.
 *
 * @param parent - Parent node containing the marker paragraph.
 * @param index - Index of the marker within the parent.
 */
export const removeDirectiveMarker = (parent: Parent, index: number): void => {
  const node = parent.children[index] as RootContent | undefined
  if (!node) return
  if (node.type === 'text') {
    let text = (node as MdText).value
    if (text.trim() === DIRECTIVE_MARKER) {
      parent.children.splice(index, 1)
      return
    }
    text = text.split(DIRECTIVE_MARKER).join('')
    if (text === (node as MdText).value) return
    if (text.trim()) {
      ;(node as MdText).value = text
    } else {
      parent.children.splice(index, 1)
    }
    return
  }
  if (node.type !== 'paragraph') return
  const first = (node as Paragraph).children[0]
  if (!first || first.type !== 'text') return
  let text = (first as MdText).value
  if (text.trim() === DIRECTIVE_MARKER) {
    parent.children.splice(index, 1)
    return
  }
  text = text.split(DIRECTIVE_MARKER).join('')
  if (text === (first as MdText).value) return
  if (text.trim()) {
    ;(first as MdText).value = text
    return
  }
  parent.children.splice(index, 1)
}

/**
 * Determines if a node is a paragraph containing only directive markers.
 *
 * @param node - Node to inspect.
 * @returns True if the node consists solely of directive markers.
 */
export const isMarkerParagraph = (node: RootContent): boolean => {
  if (node.type !== 'paragraph') return false
  const text = toString(node).replace(/\s+/g, '')
  if (!text) return false
  const parts = text.split(DIRECTIVE_MARKER)
  return parts.every(part => part === '')
}

/**
 * Parses a deck size string such as "1920x1080" or an aspect ratio like "16x9".
 * Aspect ratios assume a default width of {@link DEFAULT_DECK_WIDTH} pixels.
 *
 * @param value - Raw size attribute value.
 * @returns Parsed deck size object.
 */
export const parseDeckSize = (
  value: string
): { width: number; height: number } => {
  const match = value.match(/^(\d+)x(\d+)$/)
  if (match) {
    const w = parseInt(match[1], 10)
    const h = parseInt(match[2], 10)
    if (w <= ASPECT_RATIO_THRESHOLD && h <= ASPECT_RATIO_THRESHOLD) {
      const width = DEFAULT_DECK_WIDTH
      const height = Math.round((width * h) / w)
      return { width, height }
    }
    return { width: w, height: h }
  }
  return { width: DEFAULT_DECK_WIDTH, height: DEFAULT_DECK_HEIGHT }
}

/**
 * Parses a theme attribute value, accepting either a string token or a JSON object string.
 *
 * @param value - Raw theme attribute value.
 * @returns Theme token map when parsable.
 */
export const parseThemeValue = (
  value: unknown
): Record<string, string | number> | undefined => {
  if (!value) return undefined
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return { theme: value }
    }
  }
  if (typeof value === 'object') return value as Record<string, string | number>
  return undefined
}

/**
 * Copies attributes from a source map into a target props object, excluding keys in {@link exclude}.
 * Emits an error if the `class` attribute is encountered, as it is reserved.
 *
 * @param source - Raw attribute map.
 * @param target - Props object to receive the attributes.
 * @param exclude - Keys to omit when copying.
 * @param addError - Callback to record an error message.
 */
export const applyAdditionalAttributes = (
  source: Record<string, unknown>,
  target: Record<string, unknown>,
  exclude: readonly string[],
  addError: (msg: string) => void
): void => {
  for (const key of Object.keys(source)) {
    if (key === 'class') {
      const msg = 'class is a reserved attribute. Use className instead.'
      console.error(msg)
      addError(msg)
      throw new Error(msg)
    }
    if (key === 'classes' || key === 'layerClass' || key === 'layerClasses')
      continue
    if (!exclude.includes(key)) {
      target[key] = source[key]
    }
  }
}

/**
 * Merges preset attributes with raw directive attributes, with raw values taking precedence.
 *
 * @param preset - Attributes defined in the preset.
 * @param raw - Attributes provided on the directive.
 * @returns Combined attribute map.
 */
export const mergeAttrs = <T extends Record<string, unknown>>(
  preset: Partial<T> | undefined,
  raw: T
): T => ({ ...(preset || {}), ...raw })
