import { describe, it, expect } from 'bun:test'
import { VFile } from 'vfile'
import remarkCampfire from '../index'
import type { Root, Paragraph, Text } from 'mdast'
import type { LeafDirective } from 'mdast-util-directive'

/**
 * Creates a paragraph node containing only whitespace.
 *
 * @returns Whitespace-only paragraph node.
 */
const createWhitespaceParagraph = (): Paragraph => ({
  type: 'paragraph',
  children: [{ type: 'text', value: '  ' } as Text]
})

describe('remarkCampfire whitespace stripping', () => {
  it('handles directives and removes whitespace-only paragraphs', () => {
    const directive: LeafDirective = {
      type: 'leafDirective',
      name: 'test',
      children: []
    }
    const retained: Paragraph = {
      type: 'paragraph',
      data: { hName: 'span' },
      children: [{ type: 'text', value: ' ' } as Text]
    }
    const tree: Root = {
      type: 'root',
      children: [createWhitespaceParagraph(), directive, retained]
    }
    let handled = false
    remarkCampfire({
      handlers: {
        test: () => {
          handled = true
        }
      }
    })(tree, new VFile(''))
    expect(handled).toBe(true)
    expect(tree.children).toHaveLength(2)
    expect(tree.children[0]).toBe(directive)
    expect((tree.children[1] as Paragraph).data?.hName).toBe('span')
  })
})
