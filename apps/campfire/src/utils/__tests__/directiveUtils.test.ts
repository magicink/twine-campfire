import { describe, it, expect } from 'bun:test'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import type { RootContent } from 'mdast'
import { runDirectiveBlock } from '@campfire/utils/directiveUtils'
import type { DirectiveHandler } from '@campfire/remark-campfire'

describe('runDirectiveBlock', () => {
  it('executes directive handlers', () => {
    const nodes = unified()
      .use(remarkParse)
      .use(remarkDirective)
      .parse(':test[]').children as RootContent[]
    let called = false
    const handler: DirectiveHandler = () => {
      called = true
    }
    runDirectiveBlock(nodes, { test: handler })
    expect(called).toBe(true)
  })
})
