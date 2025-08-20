import { visit } from 'unist-util-visit'
import type { Root, Paragraph } from 'mdast'
import type { Data } from 'unist'
import type { Properties } from 'hast'
import { appendClassNames } from '@campfire/utils/remarkHelpers'

/**
 * Applies default Tailwind font family and size classes to Markdown paragraph nodes.
 *
 * @returns Transformer attaching class names to paragraph elements.
 */
interface NodeData extends Data {
  hName?: string
  hProperties?: Properties
}

export const remarkParagraphStyles = () => (tree: Root) => {
  visit(tree, 'paragraph', (node: Paragraph) => {
    const data = (node.data ?? (node.data = {})) as NodeData
    if (data.hName) return
    appendClassNames(node, ['font-libertinus', 'text-base'])
  })
}
