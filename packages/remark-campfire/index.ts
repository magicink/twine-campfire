import { visit } from 'unist-util-visit'
import type { Root, Parent, Paragraph, Text } from 'mdast'
import type { Node } from 'unist'
import type { LeafDirective } from 'mdast-util-directive'
import type { SKIP } from 'unist-util-visit'
import type { VFile } from 'vfile'
import type { DirectiveNode } from './helpers'

/** Error code for unquoted trigger labels */
const ERR_TRIGGER_LABEL_UNQUOTED = 'CF001'

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
            const content =
              typeof file.value === 'string' ? file.value : undefined
            if (content) {
              const raw = content.slice(
                directive.position?.start.offset ?? 0,
                directive.position?.end.offset ?? 0
              )
              const attrMatch = raw.match(/label[ \t]*=[ \t]*(['"`])/)
              if (
                typeof directive.attributes.label !== 'string' ||
                !attrMatch ||
                !raw
                  .slice((attrMatch.index ?? 0) + attrMatch[0].length)
                  .includes(attrMatch[1])
              ) {
                delete directive.attributes.label
                const msg = `${ERR_TRIGGER_LABEL_UNQUOTED}: trigger label must be a quoted string`
                console.error(msg)
                file.message(msg, directive)
              }
            } else if (typeof directive.attributes.label !== 'string') {
              delete directive.attributes.label
              const msg = `${ERR_TRIGGER_LABEL_UNQUOTED}: trigger label must be a quoted string`
              console.error(msg)
              file.message(msg, directive)
            }
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
