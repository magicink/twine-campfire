import { describe, it, expect } from 'bun:test'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkCampfire, { type DirectiveHandler } from '../index'
import type {
  ContainerDirective,
  LeafDirective,
  TextDirective
} from 'mdast-util-directive'

type DirectiveNode = ContainerDirective | LeafDirective | TextDirective

/**
 * Processes markdown containing a directive and returns the directive node.
 *
 * @param md - Markdown string to process.
 * @returns The captured directive node.
 */
const parseDirective = (md: string) => {
  let captured: DirectiveNode | undefined
  const handler: DirectiveHandler = directive => {
    captured = directive
  }
  const processor = unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkCampfire, { handlers: { test: handler } })

  const tree = processor.parse(md)
  processor.runSync(tree)
  return captured
}

describe('remarkCampfire attribute parsing', () => {
  it('parses safe attribute values', () => {
    const node = parseDirective(":test{items=1,'two'}")
    expect(node?.attributes).toEqual({ items: "1,'two'" })
  })

  it('parses attribute values containing brackets', () => {
    const node = parseDirective(":test{items=['one','two']}")
    expect(node?.attributes).toEqual({ items: "['one','two']" })
  })

  it('ignores attributes with unsafe characters', () => {
    const node = parseDirective(":test{items=1,'<script>'}")
    expect(node?.attributes).toEqual({})
  })
})
