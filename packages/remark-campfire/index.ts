import { visit } from 'unist-util-visit'
import type { Root, Parent } from 'mdast'
import type { Node } from 'unist'
import type { DirectiveNode } from './helpers'
import { handleDirective, type DirectiveHandler } from './directives'

export interface RemarkCampfireOptions {
  handlers?: Record<string, DirectiveHandler>
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
          return handleDirective(directive, parent, index)
        }
      }
    )
  }

export default remarkCampfire
