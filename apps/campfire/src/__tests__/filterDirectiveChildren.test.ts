import { describe, expect, it } from 'bun:test'
import type { Paragraph, RootContent } from 'mdast'
import type { LeafDirective, TextDirective } from 'mdast-util-directive'
import { filterDirectiveChildren } from '../hooks/useDirectiveHandlers'

describe('filterDirectiveChildren', () => {
  const names = [
    'set',
    'setOnce',
    'array',
    'arrayOnce',
    'createRange',
    'setRange',
    'random',
    'randomOnce',
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'concat',
    'checkpoint',
    'loadCheckpoint',
    'clearCheckpoint',
    'save',
    'load',
    'clearSave',
    'lang',
    'translations'
  ]
  const allowed = new Set(names)
  it('allows leaf directives', () => {
    const nodes: LeafDirective[] = names.map(name => ({
      type: 'leafDirective',
      name,
      children: []
    }))
    const [filtered, invalid, banned] = filterDirectiveChildren(nodes, allowed)
    expect(filtered).toEqual(nodes)
    expect(invalid).toBe(false)
    expect(banned).toBe(false)
  })

  it('flags non-directive content', () => {
    const text: RootContent = { type: 'text', value: 'oops' }
    const [filtered, invalid] = filterDirectiveChildren([text], allowed)
    expect(filtered.length).toBe(0)
    expect(invalid).toBe(true)
  })

  it('detects banned directives', () => {
    const node: LeafDirective = {
      type: 'leafDirective',
      name: 'unset',
      children: []
    }
    const [, , banned] = filterDirectiveChildren(
      [node],
      allowed,
      new Set(['unset'])
    )
    expect(banned).toBe(true)
  })

  it('collects inline directives in paragraphs', () => {
    const inline: TextDirective = {
      type: 'textDirective',
      name: 'set',
      children: []
    }
    const para: Paragraph = { type: 'paragraph', children: [inline] }
    const [filtered, invalid] = filterDirectiveChildren([para], allowed)
    expect(filtered).toEqual([inline])
    expect(invalid).toBe(false)
  })

  it('flags paragraphs mixing text with directives', () => {
    const inline: TextDirective = {
      type: 'textDirective',
      name: 'set',
      children: []
    }
    const para: Paragraph = {
      type: 'paragraph',
      children: [{ type: 'text', value: 'oops' }, inline]
    }
    const [, invalid] = filterDirectiveChildren([para], allowed)
    expect(invalid).toBe(true)
  })
})
