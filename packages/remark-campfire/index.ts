import { visit } from 'unist-util-visit'
import type { Root, Parent, Paragraph, Text } from 'mdast'
import type { Node } from 'unist'
import type { LeafDirective, ContainerDirective } from 'mdast-util-directive'
import type { SKIP } from 'unist-util-visit'
import type { DirectiveNode } from './helpers'

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

export interface OnEnterDirective
  extends Omit<ContainerDirective, 'attributes'> {
  name: 'onEnter'
  attributes?: Record<string, never>
}

export interface OnExitDirective
  extends Omit<ContainerDirective, 'attributes'> {
  name: 'onExit'
  attributes?: Record<string, never>
}

export interface OnChangeAttributes {
  /** Game data key to watch */
  key: string
}

export interface OnChangeDirective
  extends Omit<ContainerDirective, 'attributes'> {
  name: 'onChange'
  attributes: OnChangeAttributes
}
const remarkCampfire =
  (options: RemarkCampfireOptions = {}) =>
  (tree: Root) => {
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
