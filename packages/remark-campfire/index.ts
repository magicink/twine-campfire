import { visit } from 'unist-util-visit'
import type { Root, Parent, Paragraph, Text } from 'mdast'
import type { Node } from 'unist'
import type { LeafDirective } from 'mdast-util-directive'
import type { SKIP } from 'unist-util-visit'
import type { VFile } from 'vfile'
import type { DirectiveNode } from './helpers'

/** Error code for unquoted trigger labels */
const ERR_TRIGGER_LABEL_UNQUOTED = 'CF001'
/** Error message for unquoted trigger labels */
const MSG_TRIGGER_LABEL_UNQUOTED = `${ERR_TRIGGER_LABEL_UNQUOTED}: trigger label must be a quoted string`
/** Error code for unquoted locale attributes */
const ERR_LOCALE_UNQUOTED = 'CF002'
/** Error message for unquoted locale attributes */
const MSG_LOCALE_UNQUOTED = `${ERR_LOCALE_UNQUOTED}: locale must be a quoted string`

export type DirectiveHandlerResult = number | [typeof SKIP, number] | void

export type DirectiveHandler = (
  directive: DirectiveNode,
  parent: Parent | undefined,
  index: number | undefined
) => DirectiveHandlerResult

export interface RemarkCampfireOptions {
  handlers?: Record<string, DirectiveHandler>
}

export interface IncludeAttributes {
  /** Passage name to include */
  name?: string
  /** Passage id to include */
  pid?: string
}

export interface IncludeDirective extends Omit<LeafDirective, 'attributes'> {
  name: 'include'
  attributes?: IncludeAttributes
}

export interface LangAttributes {
  /** Locale code to activate */
  locale: string
}

export interface LangDirective extends Omit<LeafDirective, 'attributes'> {
  name: 'lang'
  attributes: LangAttributes
}

/**
 * Attaches indentation information to directive nodes by capturing trailing
 * whitespace from the preceding text node.
 */
export const remarkCampfireIndentation = () => (tree: Root) => {
  visit(
    tree,
    (node: Node, index: number | undefined, parent: Parent | undefined) => {
      if (node.type === 'text' && parent && typeof index === 'number') {
        const next = parent.children[index + 1]
        if (
          next &&
          (next.type === 'textDirective' ||
            next.type === 'leafDirective' ||
            next.type === 'containerDirective')
        ) {
          const textNode = node as Text
          const match = textNode.value.match(/(\s+)$/)
          if (match && match[1]) {
            textNode.value = textNode.value.slice(0, -match[1].length)
            const directive = next as DirectiveNode
            if (!directive.data) directive.data = {}
            ;(directive.data as Record<string, unknown>).indentation = match[1]
          }
        }
      }
    }
  )
}

/**
 * Extracts attributes from a trailing text node when `remark-directive` fails to
 * parse them, enabling support for characters like quotes within attribute
 * values. Only parses values that match a safe character pattern to reduce
 * injection risks.
 *
 * @param directive - Directive node being processed.
 * @param parent - Parent node containing the directive.
 * @param index - Index of the directive within its parent.
 */
const parseFallbackAttributes = (
  directive: DirectiveNode,
  parent: Parent,
  index: number
) => {
  const next = parent.children[index + 1]
  if (!next || next.type !== 'text') return
  const textNode = next as Text
  const match = textNode.value.match(/^\{([\w-]+)=([^}]*)\}$/)
  if (match) {
    const [, name, raw] = match
    if (/^[\w\s.,'"`-]*$/.test(raw)) {
      directive.attributes = { [name]: raw }
      parent.children.splice(index + 1, 1)
    } else {
      directive.attributes = undefined
    }
  }
}

/**
 * Ensures that a directive attribute is a quoted string.
 *
 * @param directive - Directive node being processed.
 * @param name - Attribute name to verify.
 * @param file - VFile used for error reporting.
 * @param message - Error message to emit when validation fails.
 */
const ensureQuotedAttribute = (
  directive: DirectiveNode,
  name: string,
  file: VFile,
  message: string
) => {
  const content = typeof file.value === 'string' ? file.value : undefined
  if (content) {
    const raw = content.slice(
      directive.position?.start.offset ?? 0,
      directive.position?.end.offset ?? 0
    )
    const attrMatch = raw.match(
      new RegExp(`${name}\\s*=\\s*(['"\`])((?:\\\\.|(?!\\1).)*)\\1`)
    )
    const attrs = directive.attributes as Record<string, unknown>
    if (typeof attrs[name] !== 'string' || !attrMatch) {
      delete attrs[name]
      file.message(message, directive)
    }
  } else {
    const attrs = directive.attributes as Record<string, unknown>
    if (typeof attrs[name] !== 'string') {
      delete attrs[name]
      file.message(message, directive)
    }
  }
}

const remarkCampfire =
  (options: RemarkCampfireOptions = {}) =>
  (tree: Root, file: VFile) => {
    visit(
      tree,
      (node: Node, index: number | undefined, parent: Parent | undefined) => {
        if (
          node &&
          (node.type === 'textDirective' ||
            node.type === 'leafDirective' ||
            node.type === 'containerDirective')
        ) {
          const directive = node as DirectiveNode
          if (
            (!directive.attributes ||
              Object.keys(directive.attributes).length === 0) &&
            parent &&
            typeof index === 'number'
          ) {
            parseFallbackAttributes(directive, parent, index)
          }
          if (
            directive.name === 'trigger' &&
            directive.attributes &&
            Object.prototype.hasOwnProperty.call(directive.attributes, 'label')
          ) {
            ensureQuotedAttribute(
              directive,
              'label',
              file,
              MSG_TRIGGER_LABEL_UNQUOTED
            )
          }
          if (
            directive.attributes &&
            directive.name === 'lang' &&
            Object.prototype.hasOwnProperty.call(directive.attributes, 'locale')
          ) {
            ensureQuotedAttribute(
              directive,
              'locale',
              file,
              MSG_LOCALE_UNQUOTED
            )
          }
          const handler = options.handlers?.[directive.name]
          if (handler) {
            return handler(directive, parent, index)
          }
        }
      }
    )

    visit(
      tree,
      (node: Node, index: number | undefined, parent: Parent | undefined) => {
        if (node.type === 'paragraph' && parent && typeof index === 'number') {
          const paragraph = node as Paragraph
          // Preserve paragraphs transformed into custom elements
          if (paragraph.data?.hName) return
          const hasContent = paragraph.children.some(child => {
            return !(
              child.type === 'text' && (child as Text).value.trim() === ''
            )
          })
          if (!hasContent) {
            parent.children.splice(index, 1)
            return index
          }
        }
      }
    )
  }

export default remarkCampfire
