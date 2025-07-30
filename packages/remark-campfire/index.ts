import { visit } from 'unist-util-visit'
import type { Root, Parent } from 'mdast'
import type { Node } from 'unist'
import type { DirectiveNode } from './helpers'
import { handleDirective } from './directives'

const remarkCampfire = () => (tree: Root) => {
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
        return handleDirective(directive, parent, index)
      }
    }
  )
}

export default remarkCampfire
