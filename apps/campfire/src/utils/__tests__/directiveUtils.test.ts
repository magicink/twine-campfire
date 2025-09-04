import { describe, it, expect } from 'bun:test'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import type { RootContent } from 'mdast'
import {
  runDirectiveBlock,
  parseAttributeValue
} from '@campfire/utils/directiveUtils'
import type { DirectiveHandler } from '@campfire/remark-campfire'
import type { AttributeSpec } from '@campfire/utils/directiveUtils'

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

  it('reuses processors for identical handler maps', () => {
    const parse = () =>
      unified().use(remarkParse).use(remarkDirective).parse(':test[]')
        .children as RootContent[]
    const handler: DirectiveHandler = () => {}
    const handlers = { test: handler }

    const firstNodes = parse()
    const start1 = performance.now()
    runDirectiveBlock(firstNodes, handlers)
    const firstTime = performance.now() - start1

    const secondNodes = parse()
    const start2 = performance.now()
    runDirectiveBlock(secondNodes, handlers)
    const secondTime = performance.now() - start2

    expect(secondTime).toBeLessThan(firstTime)
  })
})

describe('parseAttributeValue', () => {
  it('returns raw string for quoted object values', () => {
    const spec: AttributeSpec = { type: 'object' }
    const value = parseAttributeValue('\'{"a":1}\'', spec)
    expect(value).toBe('{"a":1}')
  })

  it('returns raw string for quoted array values', () => {
    const spec: AttributeSpec = { type: 'array' }
    const value = parseAttributeValue('`[1,2,3]`', spec)
    expect(value).toBe('[1,2,3]')
  })
})
