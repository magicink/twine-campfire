import { visit } from 'unist-util-visit'
import type { Root, Paragraph } from 'mdast'
import type { Data } from 'unist'
import type { Properties } from 'hast'

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
    const props = (data.hProperties ?? (data.hProperties = {})) as Properties
    const existing = props.className
    const classes: string[] = Array.isArray(existing)
      ? existing.filter((c): c is string => typeof c === 'string')
      : typeof existing === 'string'
        ? [existing]
        : []
    classes.push('font-libertinus', 'text-base')
    props.className = classes
  })
}
