import { toString } from 'mdast-util-to-string'
import type { RootContent, Text as MdText, Paragraph } from 'mdast'
import type { Text as HastText } from 'hast'
import { isMarkerParagraph } from '@campfire/utils/directiveHandlerUtils'

type AnyText = MdText | HastText

/**
 * Determines whether a node is a text node containing only whitespace.
 *
 * @param node - Node to inspect.
 * @returns True when the node is a whitespace-only text node.
 */
export const isWhitespaceText = (node: unknown): node is AnyText =>
  (node as AnyText)?.type === 'text' &&
  typeof (node as AnyText).value === 'string' &&
  (node as AnyText).value.trim() === ''

/**
 * Determines whether a root content node is insignificant whitespace or
 * directive marker content.
 *
 * @param node - Root content node to test.
 * @returns True when the node should be treated as whitespace.
 */
export const isWhitespaceRootContent = (node: RootContent): boolean =>
  (node.type === 'text' && isWhitespaceText(node as MdText)) ||
  (node.type === 'paragraph' &&
    (node as Paragraph).children.every(child => child.type === 'text') &&
    (toString(node).trim() === '' || isMarkerParagraph(node)))
