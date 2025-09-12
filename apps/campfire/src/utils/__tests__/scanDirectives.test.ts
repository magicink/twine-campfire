import { describe, it, expect } from 'bun:test'
import { scanDirectives } from '@campfire/utils/scanDirectives'

describe('scanDirectives', () => {
  const collect = (src: string) =>
    [...scanDirectives(src)].map(t => ({ type: t.type, value: t.value }))

  it('scans leaf directive with label', () => {
    expect(collect('::name[]')).toEqual([{ type: 'leaf', value: '::name[]' }])
  })

  it('scans inline directive with label', () => {
    expect(collect(':name[]')).toEqual([{ type: 'leaf', value: ':name[]' }])
  })

  it('scans container directive with attributes', () => {
    expect(collect(':::name{}')).toEqual([
      { type: 'container', value: ':::name{}' }
    ])
  })

  it('handles mismatched braces', () => {
    expect(collect(':name{')).toEqual([{ type: 'leaf', value: ':name{' }])
  })

  it('handles trailing escape in label', () => {
    const src = ':name[' + '\\'
    expect(collect(src)).toEqual([{ type: 'leaf', value: src }])
  })

  it('handles trailing escape in attributes', () => {
    const src = ':name{' + '\\'
    expect(collect(src)).toEqual([{ type: 'leaf', value: src }])
  })

  it('emits text tokens around directives', () => {
    expect(collect('a\n::b[]\n')).toEqual([
      { type: 'text', value: 'a\n' },
      { type: 'leaf', value: '::b[]' },
      { type: 'text', value: '\n' }
    ])
  })
})
