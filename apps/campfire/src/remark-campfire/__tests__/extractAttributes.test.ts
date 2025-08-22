import { describe, it, expect } from 'bun:test'
import type { Parent } from 'mdast'
import type { ContainerDirective } from 'mdast-util-directive'
import {
  extractAttributes,
  type DirectiveNode
} from '@campfire/utils/directiveUtils'

/**
 * Creates a directive node with the given attributes for testing.
 *
 * @param attrs - Attribute map to assign to the directive.
 * @returns A directive node populated with the attributes.
 */
const createDirective = (attrs: Record<string, unknown> = {}): DirectiveNode =>
  ({
    type: 'leafDirective',
    name: 'test',
    attributes: attrs as Record<string, unknown>
  }) as DirectiveNode

describe('extractAttributes', () => {
  it('parses and evaluates attributes according to schema', () => {
    const directive = createDirective({
      key: 'item1',
      count: 'a + b',
      flag: 'false',
      list: '1,2,3',
      obj: '{"x":1}'
    })
    const schema = {
      key: { type: 'string', required: true },
      count: { type: 'number' },
      flag: { type: 'boolean', default: true },
      list: { type: 'array' },
      obj: { type: 'object' }
    } as const
    const result = extractAttributes(directive, undefined, undefined, schema, {
      state: { a: 2, b: 3 },
      keyAttr: 'key'
    })
    expect(result.valid).toBe(true)
    expect(result.key).toBe('item1')
    expect(result.attrs as Record<string, unknown>).toEqual({
      count: 5,
      flag: false,
      list: ['1', '2', '3'],
      obj: { x: 1 }
    })
  })

  it('reports missing required key and removes directive', () => {
    const directive = createDirective()
    const parent: Parent = { type: 'root', children: [directive] }
    const schema = { key: { type: 'string', required: true } } as const
    const result = extractAttributes(directive, parent, 0, schema, {
      keyAttr: 'key'
    })
    expect(result.valid).toBe(false)
    expect(parent.children).toHaveLength(0)
    expect(result.errors[0]).toContain('missing required key attribute')
  })

  it('extracts label text when requested', () => {
    const directive: ContainerDirective = {
      type: 'containerDirective',
      name: 'test',
      attributes: { key: 'id' },
      children: [
        {
          type: 'paragraph',
          data: { directiveLabel: true },
          children: [{ type: 'text', value: 'Label text' }]
        }
      ]
    }
    const schema = { key: { type: 'string' } } as const
    const result = extractAttributes(directive, undefined, undefined, schema, {
      keyAttr: 'key',
      label: true
    })
    expect(result.label).toBe('Label text')
  })

  it('parses unquoted object attributes', () => {
    const directive = createDirective({ obj: "x:1,y:'two'" })
    const schema = { obj: { type: 'object' } } as const
    const result = extractAttributes(directive, undefined, undefined, schema)
    expect((result.attrs as any).obj).toEqual({ x: 1, y: 'two' })
  })
})
