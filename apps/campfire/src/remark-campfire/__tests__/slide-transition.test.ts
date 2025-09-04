import { describe, it, expect } from 'bun:test'
import { unified } from 'unified'
import { VFile } from 'vfile'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkCampfire, { type DirectiveHandler } from '../index'
import type { ContainerDirective } from 'mdast-util-directive'

/**
 * Parses markdown containing a slide directive and returns the directive node and file.
 *
 * @param md - Markdown string to process.
 * @returns The parsed slide directive node and VFile.
 */
const parseSlide = (md: string) => {
  let captured: ContainerDirective | undefined
  const handler: DirectiveHandler = directive => {
    captured = directive as ContainerDirective
  }
  const processor = unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkCampfire, { handlers: { slide: handler } })
  const file = new VFile(md)
  const tree = processor.parse(md)
  processor.runSync(tree, file)
  return { node: captured, file }
}

describe('slide transition attribute', () => {
  it('accepts quoted transition', () => {
    const { node, file } = parseSlide(':::slide{transition="fade"}\n:::')
    expect(node?.attributes).toEqual({ transition: 'fade' })
    expect(file.messages).toHaveLength(0)
  })

  it('rejects unquoted transition', () => {
    const { node, file } = parseSlide(':::slide{transition=fade}\n:::')
    expect(node?.attributes).toEqual({})
    expect(
      file.messages.some(m =>
        m.message.includes('slide transition must be a quoted string')
      )
    ).toBe(true)
  })
})
