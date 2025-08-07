import { describe, it, expect } from 'bun:test'
import { unified } from 'unified'
import { VFile } from 'vfile'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkCampfire, { type DirectiveHandler } from '../index'
import type { ContainerDirective } from 'mdast-util-directive'

/**
 * Parses markdown containing a trigger directive and returns the directive node.
 *
 * @param md - Markdown string to process.
 * @returns The parsed trigger directive node.
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
  const tree = processor.parse(md)
  processor.runSync(tree, new VFile(md))
  return captured
}

describe('trigger label attribute', () => {
  it('accepts quoted labels', () => {
    const node = parseTrigger(':::trigger{label="Fire"}\n:::')
    expect(node?.attributes).toEqual({ label: 'Fire' })
  })

  it('rejects unquoted labels', () => {
    const orig = console.error
    const logs: unknown[] = []
    console.error = (...args: unknown[]) => {
      logs.push(args.join(' '))
    }
    const node = parseTrigger(':::trigger{label=Fire}\n:::')
    expect(node?.attributes).toEqual({})
    expect(logs.some(l => typeof l === 'string' && l.includes('CF001'))).toBe(
      true
    )
    console.error = orig
  })

  it('rejects mismatched quotes', () => {
    const node = parseTrigger(':::trigger{label="Fire\'}\n:::')
    expect(node?.attributes ?? {}).toEqual({})
  })
})
