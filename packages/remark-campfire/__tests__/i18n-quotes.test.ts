import { describe, it, expect } from 'bun:test'
import { unified } from 'unified'
import { VFile } from 'vfile'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkCampfire, { type DirectiveHandler } from '../index'
import type { DirectiveNode } from '../helpers'
import { toString } from 'mdast-util-to-string'

/**
 * Parses markdown containing a directive and returns the directive node and file.
 *
 * @param md - Markdown string to process.
 * @param name - Directive name to capture.
 * @returns The parsed directive node and VFile.
 */
const parseDirective = (md: string, name: string) => {
  let captured: DirectiveNode | undefined
  const handler: DirectiveHandler = directive => {
    captured = directive
  }
  const processor = unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkCampfire, { handlers: { [name]: handler } })
  const file = new VFile(md)
  const tree = processor.parse(md)
  processor.runSync(tree, file)
  return { node: captured, file }
}

describe('lang directive', () => {
  it('parses locale from label', () => {
    const { node } = parseDirective(':lang[fr]', 'lang')
    expect(node && toString(node)).toBe('fr')
  })
})
