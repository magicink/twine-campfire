import { describe, it, expect } from 'bun:test'
import type { DirectiveNode } from '@campfire/utils/directiveUtils'
import type { Parent } from 'mdast'
import {
  parseTypedValue,
  parseObjectLiteral,
  extractKeyValue,
  applyKeyValue
} from '@campfire/utils/directiveUtils'

describe('parseTypedValue', () => {
  it('parses numbers and booleans', () => {
    expect(parseTypedValue('42')).toBe(42)
    expect(parseTypedValue('true')).toBe(true)
    expect(parseTypedValue('"hi"')).toBe('hi')
  })

  it('evaluates expressions with caching', () => {
    const data: Record<string, unknown> = { x: 2 }
    expect(parseTypedValue('x + 1', data)).toBe(3)
    data.x = 3
    expect(parseTypedValue('x + 1', data)).toBe(4)
  })

  it('parses object literals', () => {
    const obj = parseTypedValue('{a:1,b:"two"}') as Record<string, unknown>
    expect(obj.a).toBe(1)
    expect(obj.b).toBe('two')
  })

  it('treats quoted objects as strings', () => {
    expect(parseTypedValue('"{a:1}"')).toBe('{a:1}')
  })
})

describe('parseObjectLiteral', () => {
  it('parses colon-delimited objects without braces', () => {
    const obj = parseObjectLiteral('a:1, b:"two"')
    expect(obj).toEqual({ a: 1, b: 'two' })
  })
})

describe('extractKeyValue and applyKeyValue', () => {
  it('extracts and applies key/value pairs', () => {
    const directive = {
      type: 'leafDirective',
      name: 'set',
      label: 'score=1+1',
      attributes: {},
      children: []
    } as unknown as DirectiveNode
    const parent: Parent = { type: 'root', children: [directive] }
    let stored: any
    applyKeyValue(directive, parent, 0, {
      parse: raw => parseTypedValue(raw, {}),
      setValue: (k, v) => {
        stored = { k, v }
      },
      onError: () => {}
    })
    expect(stored).toEqual({ k: 'score', v: 2 })
    expect(parent.children.length).toBe(0)
  })
})
