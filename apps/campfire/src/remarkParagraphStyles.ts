import { visit } from 'unist-util-visit'
import type { Root } from 'mdast'

/**
 * Applies default Tailwind font family and size classes to Markdown paragraph nodes.
 *
 * @returns Transformer attaching class names to paragraph elements.
 */
export const remarkParagraphStyles = () => (tree: Root) => {
  visit(tree, 'paragraph', node => {
    const data: any = node.data ?? (node.data = {})
    if (data.hName) return
    const props: any = data.hProperties ?? (data.hProperties = {})
    const existing = props.className
    const classes: string[] = Array.isArray(existing)
      ? existing.filter((c): c is string => typeof c === 'string')
      : typeof existing === 'string'
        ? [existing]
        : []
    classes.push('font-cormorant', 'text-lg')
    props.className = classes
  })
}
