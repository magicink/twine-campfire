import { describe, it, expect } from 'bun:test'
import type { Root as MdRoot } from 'mdast'
import type { Root as HastRoot } from 'hast'
import {
  remarkHeadingStyles,
  remarkParagraphStyles,
  rehypeTableStyles,
  rehypeChecklistButtons
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

describe('rehypeChecklistButtons', () => {
  it('converts checklist inputs to buttons', () => {
    const tree: HastRoot = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'input',
          properties: { type: 'checkbox', checked: true },
          children: []
        } as any
      ]
    }
    rehypeChecklistButtons()(tree)
    const btn = tree.children[0] as any
    expect(btn.tagName).toBe('button')
    expect(btn.properties['data-state']).toBe('checked')
    expect(btn.properties.disabled).toBe(true)
    expect(btn.children[0].tagName).toBe('span')
    expect(btn.children[0].children[0].tagName).toBe('svg')
  })

  it('omits checkmark when unchecked', () => {
    const tree: HastRoot = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'input',
          properties: { type: 'checkbox' },
          children: []
        } as any
      ]
    }
    rehypeChecklistButtons()(tree)
    const btn = tree.children[0] as any
    expect(btn.children[0].children).toEqual([])
  })

  it('styles task list containers', () => {
    const tree: HastRoot = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'ul',
          properties: { className: ['contains-task-list'] },
          children: []
        } as any
      ]
    }
    rehypeChecklistButtons()(tree)
    const ul = tree.children[0] as any
    expect(ul.properties.className).toEqual([
      'contains-task-list',
      'flex',
      'flex-col',
      'gap-[var(--size-xs)]'
    ])
  })

  it('aligns items and strikes through completed text', () => {
    const tree: HastRoot = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'ul',
          properties: { className: ['contains-task-list'] },
          children: [
            {
              type: 'element',
              tagName: 'li',
              properties: { className: ['task-list-item'] },
              children: [
                {
                  type: 'element',
                  tagName: 'input',
                  properties: { type: 'checkbox' },
                  children: []
                },
                { type: 'text', value: ' ' },
                { type: 'text', value: 'todo' }
              ]
            } as any,
            {
              type: 'element',
              tagName: 'li',
              properties: { className: ['task-list-item'] },
              children: [
                {
                  type: 'element',
                  tagName: 'input',
                  properties: { type: 'checkbox', checked: true },
                  children: []
                },
                { type: 'text', value: ' ' },
                { type: 'text', value: 'done' }
              ]
            } as any
          ]
        } as any
      ]
    }
    rehypeChecklistButtons()(tree)
    const ul = tree.children[0] as any
    const unchecked = ul.children[0] as any
    const checked = ul.children[1] as any

    expect(unchecked.properties.className).toEqual([
      'task-list-item',
      'flex',
      'items-center',
      'gap-[var(--size-xs)]'
    ])
    expect(unchecked.children[1].properties.className).toEqual([
      'peer-data-[state=checked]:line-through'
    ])
    expect(unchecked.children[1].children[0].value).toBe('todo')

    expect(checked.children[0].properties['data-state']).toBe('checked')
    expect(checked.children[1].properties.className).toEqual([
      'peer-data-[state=checked]:line-through'
    ])
    expect(checked.children[1].children[0].value).toBe('done')
  })
})
