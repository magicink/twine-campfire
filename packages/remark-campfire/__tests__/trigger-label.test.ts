import { describe, it, expect } from 'bun:test'
import { unified } from 'unified'
import { VFile } from 'vfile'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkCampfire, { type DirectiveHandler } from '../index'
import type { ContainerDirective } from 'mdast-util-directive'

/**
 * Parses markdown containing a trigger directive and returns the directive node and file.
 *
 * @param md - Markdown string to process.
 * @returns The parsed trigger directive node and VFile.
 */
const parseTrigger = (md: string) => {
  let captured: ContainerDirective | undefined
  const handler: DirectiveHandler = directive => {
    captured = directive as ContainerDirective
  }
  const processor = unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkCampfire, { handlers: { trigger: handler } })
  const file = new VFile(md)
  const tree = processor.parse(md)
  processor.runSync(tree, file)
  return { node: captured, file }
}

describe('trigger label attribute', () => {
  it('accepts quoted labels', () => {
    const { node } = parseTrigger(':::trigger{label="Fire"}\n:::')
    expect(node?.attributes).toEqual({ label: 'Fire' })
  })

  it('accepts quotes inside labels', () => {
    const { node } = parseTrigger(':::trigger{label="John\'s house"}\n:::')
    expect(node?.attributes).toEqual({ label: "John's house" })
  })

  it('rejects unquoted labels', () => {
    const { node, file } = parseTrigger(':::trigger{label=Fire}\n:::')
    expect(node?.attributes).toEqual({})
    expect(
      file.messages.some(m =>
        m.message.includes('trigger label must be a quoted string')
      )
    ).toBe(true)
  })

  it('rejects mismatched quotes', () => {
    const { node } = parseTrigger(':::trigger{label="Fire\'}\n:::')
    expect(node?.attributes ?? {}).toEqual({})
  })
})
