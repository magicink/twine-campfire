import { describe, it, expect } from 'bun:test'
import { appendClassNames } from '@campfire/utils/remarkStyles'

describe('appendClassNames', () => {
  it('creates className array when none exists', () => {
    const node: any = {}
    appendClassNames(node, ['foo', 'bar'])
    expect(node.data?.hProperties?.className).toEqual(['foo', 'bar'])
  })

  it('merges with existing class names array', () => {
    const node: any = { data: { hProperties: { className: ['one', 2] } } }
    appendClassNames(node, ['two'])
    expect(node.data?.hProperties?.className).toEqual(['one', 'two'])
  })

  it('converts existing string className to array', () => {
    const node: any = { data: { hProperties: { className: 'one' } } }
    appendClassNames(node, ['two'])
    expect(node.data?.hProperties?.className).toEqual(['one', 'two'])
  })
})
