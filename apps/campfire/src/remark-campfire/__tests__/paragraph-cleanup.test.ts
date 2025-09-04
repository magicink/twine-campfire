import { describe, it, expect } from 'bun:test'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import { VFile } from 'vfile'
import remarkCampfire, { type DirectiveHandler } from '../index'
import type { Root } from 'mdast'

/**
 * Processes Markdown with the remarkCampfire plugin and optional handlers.
 *
 * @param md - Markdown string to process.
 * @param handlers - Directive handlers to register.
 * @returns The processed root node.
 */
const process = (
  md: string,
  handlers: Record<string, DirectiveHandler> = {}
): Root => {
  const processor = unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkCampfire, { handlers })
  const file = new VFile(md)
  const tree = processor.parse(md)
  processor.runSync(tree, file)
  return tree as Root
}

describe('remarkCampfire paragraph cleanup', () => {
  it('removes whitespace-only paragraphs after directive handlers run', () => {
    const handler: DirectiveHandler = (directive, parent, index) => {
      if (parent && typeof index === 'number') {
        parent.children.splice(index, 1)
      }
    }
    const tree = process(':remove[]', { remove: handler })
    expect(tree.children).toHaveLength(0)
  })

  it('preserves paragraphs transformed into custom elements', () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          data: { hName: 'span' },
          children: [{ type: 'text', value: ' ' }]
        }
      ]
    }
    const file = new VFile('')
    remarkCampfire()(tree, file)
    expect(tree.children).toHaveLength(1)
  })
})
