import { visit } from 'unist-util-visit'
import type { Root } from 'mdast'

/**
 * Applies default Tailwind font family, size, and weight classes to Markdown heading nodes.
 *
 * @returns Transformer attaching class names to heading elements.
 */
export const remarkHeadingStyles = () => (tree: Root) => {
  visit(tree, 'heading', node => {
    const mapping: Record<number, string> = {
      1: 'font-libertinus text-4xl font-bold',
      2: 'font-libertinus text-3xl font-semibold',
      3: 'font-libertinus text-2xl font-medium',
      4: 'font-libertinus text-xl font-normal',
      5: 'font-libertinus text-lg font-normal',
      6: 'font-libertinus text-base font-light'
    }
    const cls = mapping[node.depth]
    if (!cls) return
    if (!node.data) node.data = {}
    if (!node.data.hProperties) node.data.hProperties = {}
    const existing = node.data.hProperties.className
    const classes: string[] = Array.isArray(existing)
      ? existing.filter((c): c is string => typeof c === 'string')
      : typeof existing === 'string'
        ? [existing]
        : []
    classes.push(cls)
    node.data.hProperties.className = classes
  })
}
