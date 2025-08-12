import { visit } from 'unist-util-visit'
import type { Root } from 'mdast'

/**
 * Applies default Tailwind font size and weight classes to Markdown heading nodes.
 *
 * @returns Transformer attaching class names to heading elements.
 */
export const remarkHeadingStyles = () => (tree: Root) => {
  visit(tree, 'heading', node => {
    const mapping: Record<number, string> = {
      1: 'text-4xl font-bold',
      2: 'text-3xl font-bold',
      3: 'text-2xl font-semibold',
      4: 'text-xl font-semibold',
      5: 'text-lg font-semibold',
      6: 'text-base font-semibold'
    }
    const cls = mapping[node.depth]
    if (!cls) return
    if (!node.data) node.data = {}
    if (!node.data.hProperties) node.data.hProperties = {}
    const existing = node.data.hProperties.className
    const classes: (string | number)[] = Array.isArray(existing)
      ? [...existing]
      : typeof existing === 'string' || typeof existing === 'number'
        ? [existing]
        : []
    classes.push(cls)
    node.data.hProperties.className = classes
  })
}
