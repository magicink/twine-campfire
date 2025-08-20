import { describe, it, expect } from 'bun:test'
import type { Root } from 'mdast'
import {
  remarkHeadingStyles,
  remarkParagraphStyles
} from '@campfire/utils/remarkStyles'

describe('remarkHeadingStyles', () => {
  it('appends default classes', () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 2,
          data: { hProperties: { className: 'existing' } },
          children: []
        } as any
      ]
    }

    remarkHeadingStyles()(tree)
    expect(tree.children[0].data?.hProperties?.className).toEqual([
      'existing',
      'font-libertinus text-3xl font-semibold'
    ])
  })
})

describe('remarkParagraphStyles', () => {
  it('appends default classes', () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          data: { hProperties: { className: 'existing' } },
          children: []
        } as any
      ]
    }

    remarkParagraphStyles()(tree)
    expect(tree.children[0].data?.hProperties?.className).toEqual([
      'existing',
      'font-libertinus',
      'text-base'
    ])
  })
})
