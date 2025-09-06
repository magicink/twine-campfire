import { describe, it, expect } from 'bun:test'
import type { Parent, RootContent } from 'mdast'
import { ensureParentIndex } from '../directiveHandlerUtils'

describe('ensureParentIndex', () => {
  it('returns tuple when parent and index are valid', () => {
    const parent: Parent = { type: 'root', children: [] as RootContent[] }
    const result = ensureParentIndex(parent, 0)
    expect(result).toEqual([parent, 0])
  })

  it('returns undefined when parent or index are missing', () => {
    const parent: Parent = { type: 'root', children: [] as RootContent[] }
    expect(ensureParentIndex(undefined, 0)).toBeUndefined()
    expect(ensureParentIndex(parent, undefined)).toBeUndefined()
  })
})
