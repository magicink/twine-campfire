import { describe, it, expect } from 'bun:test'
import type { Root as MdRoot } from 'mdast'
import type { Root as HastRoot } from 'hast'
import {
  remarkHeadingStyles,
  remarkParagraphStyles,
  rehypeTableStyles
} from '@campfire/utils/remarkStyles'

describe('remarkHeadingStyles', () => {
  it('appends default classes', () => {
    const tree: MdRoot = {
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
      'font-libertinus',
      'text-3xl',
      'font-semibold'
    ])
  })
})

describe('remarkParagraphStyles', () => {
  it('appends default classes', () => {
    const tree: MdRoot = {
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

describe('rehypeTableStyles', () => {
  it('applies default table classes', () => {
    const tree: HastRoot = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'table',
          properties: {},
          children: [
            {
              type: 'element',
              tagName: 'thead',
              properties: {},
              children: [
                {
                  type: 'element',
                  tagName: 'tr',
                  properties: {},
                  children: [
                    {
                      type: 'element',
                      tagName: 'th',
                      properties: {},
                      children: []
                    }
                  ]
                }
              ]
            },
            {
              type: 'element',
              tagName: 'tbody',
              properties: {},
              children: [
                {
                  type: 'element',
                  tagName: 'tr',
                  properties: {},
                  children: [
                    {
                      type: 'element',
                      tagName: 'td',
                      properties: {},
                      children: []
                    }
                  ]
                }
              ]
            },
            {
              type: 'element',
              tagName: 'caption',
              properties: {},
              children: []
            }
          ]
        }
      ]
    }

    rehypeTableStyles()(tree)

    const table = tree.children[0] as any
    expect(table.properties.className).toEqual([
      'w-full',
      'caption-bottom',
      'text-sm'
    ])

    const thead = table.children[0] as any
    expect(thead.properties.className).toEqual(['[&_tr]:border-b'])

    const trHead = thead.children[0] as any
    expect(trHead.properties.className).toEqual([
      'hover:bg-muted/50',
      'data-[state=selected]:bg-muted',
      'border-b',
      'transition-colors'
    ])

    const th = trHead.children[0] as any
    expect(th.properties.className).toEqual([
      'text-foreground',
      'h-10',
      'px-2',
      'text-left',
      'align-middle',
      'font-medium',
      'whitespace-nowrap',
      '[&:has([role=checkbox])]:pr-0',
      '[&>[role=checkbox]]:translate-y-[2px]',
      'w-[100px]'
    ])

    const tbody = table.children[1] as any
    expect(tbody.properties.className).toEqual(['[&_tr:last-child]:border-0'])

    const trBody = tbody.children[0] as any
    expect(trBody.properties.className).toEqual([
      'hover:bg-muted/50',
      'data-[state=selected]:bg-muted',
      'border-b',
      'transition-colors'
    ])

    const td = trBody.children[0] as any
    expect(td.properties.className).toEqual([
      'p-2',
      'align-middle',
      'whitespace-nowrap',
      '[&:has([role=checkbox])]:pr-0',
      '[&>[role=checkbox]]:translate-y-[2px]',
      'font-medium'
    ])

    const caption = table.children[2] as any
    expect(caption.properties.className).toEqual([
      'text-muted-foreground',
      'mt-4',
      'text-sm'
    ])
  })
})
