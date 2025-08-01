import { visit } from 'unist-util-visit'
import type { Root, Parent } from 'mdast'
import type { Node } from 'unist'
import type { LeafDirective } from 'mdast-util-directive'
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
  }

export default remarkCampfire
