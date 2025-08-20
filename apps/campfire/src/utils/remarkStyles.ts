import { visit } from 'unist-util-visit'
import type { Root, Paragraph } from 'mdast'
import type { Data } from 'unist'
import type { Properties } from 'hast'

/**
 * Appends one or more class names to a node's `hProperties.className`,
 * preserving any existing classes.
 *
 * @param node - Target MDAST node.
 * @param classNames - Class names to append.
 */
export const appendClassNames = (
  node: { data?: Data & { hProperties?: Properties } },
  classNames: string[]
): void => {
  const data = (node.data ?? (node.data = {})) as Data & {
    hProperties?: Properties
  }
  const props = (data.hProperties ?? (data.hProperties = {})) as Properties & {
    className?: string | string[]
  }
  const existing = props.className
  const classes = Array.isArray(existing)
    ? existing.filter((c): c is string => typeof c === 'string')
    : typeof existing === 'string'
      ? [existing]
      : []
  classes.push(...classNames)
  props.className = classes
}

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
    appendClassNames(node, [cls])
  })
}
