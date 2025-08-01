import { visit, EXIT } from 'unist-util-visit'
import type { Root } from 'hast'

interface TextNode {
  type: 'text'
  value: string
}

interface ElementNode {
  type: 'element'
  tagName: string
  properties: Record<string, any>
  children: TextNode[]
}

type ReplacementNode = TextNode | ElementNode

/**
 * rehypeCampfire is a rehype plugin that transforms Harlowe-style Twine links ([[...]] syntax)
 * in a HAST (Hypertext Abstract Syntax Tree) into button elements that update
 * the current passage when clicked.
 *
 * This plugin parses text nodes for Twine link patterns, supporting both display text and target passage
 * (e.g., [[Go->Passage]] or [[Passage<-Go]]), and replaces them with interactive
 * buttons that set the passage via its name or pid.
 *
 * @returns {(tree: Root) => void} A transformer function for rehype that mutates the HAST tree in place.
 *
 * @example
 * import rehypeCampfire from '...';
 * import { unified } from 'unified';
 * import rehypeParse from 'rehype-parse';
 *
 * const processor = unified()
 *   .use(rehypeParse, { fragment: true })
 *   .use(rehypeCampfire);
 *
 * const tree = processor.parse('<p>[[Go->Passage]]</p>');
 * const transformed = processor.runSync(tree);
 * // The link will be converted to a button element
 */
export default function rehypeCampfire(): (tree: Root) => void {
  // Matches Harlowe-style links [[...]]
  const linkRegex = /\[\[([^\]]+?)]]/g

  function parseLink(raw: string): { text: string; target: string } {
    const right = raw.indexOf('->')
    const left = raw.indexOf('<-')
    if (right !== -1) {
      return {
        text: raw.slice(0, right).trim(),
        target: raw.slice(right + 2).trim()
      }
    }
    if (left !== -1) {
      return {
        text: raw.slice(left + 2).trim(),
        target: raw.slice(0, left).trim()
      }
    }
    const trimmed = raw.trim()
    return { text: trimmed, target: trimmed }
  }

  return (tree: Root) => {
    visit(tree, 'text', (node: any, index: number | undefined, parent: any) => {
      if (
        typeof node.value !== 'string' ||
        !parent ||
        !Array.isArray(parent.children) ||
        typeof index !== 'number'
      )
        return
      const value: string = node.value
      let match
      linkRegex.lastIndex = 0
      const replacements: ReplacementNode[] = []
      let lastIndex = 0
      while ((match = linkRegex.exec(value))) {
        const start = match.index ?? 0
        if (start > lastIndex) {
          replacements.push({
            type: 'text',
            value: value.slice(lastIndex, start)
          })
        }
        const { text, target } = parseLink(match[1])
        const props: Record<string, any> = {
          type: 'button',
          className: ['campfire-link']
        }
        if (/^\d+$/.test(target)) {
          props['data-pid'] = target
        } else {
          props['data-name'] = target
        }
        replacements.push({
          type: 'element',
          tagName: 'button',
          properties: props,
          children: [{ type: 'text', value: text }]
        })
        lastIndex = start + match[0].length
      }
      if (replacements.length) {
        if (lastIndex < value.length) {
          replacements.push({ type: 'text', value: value.slice(lastIndex) })
        }
        parent.children.splice(index, 1, ...replacements)
      }
    })
  }
}
