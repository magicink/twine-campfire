import { visit } from 'unist-util-visit'
import type { Root as MdRoot, Paragraph } from 'mdast'
import type { Root as HastRoot } from 'hast'
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

export const remarkParagraphStyles = () => (tree: MdRoot) => {
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
export const remarkHeadingStyles = () => (tree: MdRoot) => {
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
    appendClassNames(node, cls.split(' '))
  })
}

/**
 * Appends class names to a HAST element's `className` property, preserving any
 * existing classes.
 *
 * @param props - Element properties object.
 * @param classNames - Classes to append.
 */
const appendElementClassNames = (
  props: Record<string, unknown>,
  classNames: string[]
): void => {
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
 * Applies Tailwind utility classes to GitHub Flavored Markdown table elements.
 *
 * @returns Rehype transformer attaching classes to table-related elements.
 */
export const rehypeTableStyles =
  () =>
  (tree: HastRoot): void => {
    visit(tree, 'element', node => {
      const props = (node.properties ??= {}) as Record<string, unknown>
      switch (node.tagName) {
        case 'table':
          appendElementClassNames(props, [
            'w-full',
            'caption-bottom',
            'text-sm'
          ])
          break
        case 'thead':
          appendElementClassNames(props, ['[&_tr]:border-b'])
          break
        case 'tr':
          appendElementClassNames(props, [
            'hover:bg-muted/50',
            'data-[state=selected]:bg-muted',
            'border-b',
            'transition-colors'
          ])
          break
        case 'th':
          appendElementClassNames(props, [
            'text-foreground',
            'h-10',
            'px-2',
            'text-left',
            'align-middle',
            'font-medium',
            'whitespace-nowrap',
            '[&:has([role=checkbox])]:pr-0',
            '[&>[role=checkbox]]:translate-y-[2px]',
            'w-[100px]'
          ])
          break
        case 'tbody':
          appendElementClassNames(props, ['[&_tr:last-child]:border-0'])
          break
        case 'td':
          appendElementClassNames(props, [
            'p-2',
            'align-middle',
            'whitespace-nowrap',
            '[&:has([role=checkbox])]:pr-0',
            '[&>[role=checkbox]]:translate-y-[2px]',
            'font-medium'
          ])
          break
        case 'caption':
          appendElementClassNames(props, [
            'text-muted-foreground',
            'mt-4',
            'text-sm'
          ])
          break
      }
    })
  }
