import { describe, it, expect } from 'bun:test'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeCampfire from '../index'
import type { Root } from 'hast'

describe('rehypeCampfire', () => {
  it('leaves text intact when no special syntax is present', async () => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeCampfire)
      .use(rehypeStringify)
    const result = await processor.process('hello campfire world')
    expect(result.toString()).toBe('<p>hello campfire world</p>')
  })

  it('transforms basic harlowe link', async () => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeCampfire)
      .use(rehypeStringify)
    const result = await processor.process('Go to [[Home]]')
    const html = result.toString().replace(/\s+/g, ' ')
    expect(html).toContain('<button')
    expect(html).toContain('Home</button>')
    expect(html).toContain('class="campfire-link"')
  })

  it('transforms harlowe link with arrow', async () => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeCampfire)
      .use(rehypeStringify)
    const result = await processor.process('[[Click here->Start]]')
    const html = result.toString().replace(/\s+/g, ' ')
    expect(html).toContain('<button')
    expect(html).toContain('Click here</button>')
  })

  it('transforms harlowe link with reverse arrow', async () => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeCampfire)
      .use(rehypeStringify)
    const result = await processor.process('[[Start<-Click here]]')
    const html = result.toString().replace(/\s+/g, ' ')
    expect(html).toContain('<button')
    expect(html).toContain('Click here</button>')
  })

  it('unwraps LinkButtons from paragraphs', async () => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeCampfire)
      .use(rehypeStringify)
    const result = await processor.process('[[Start]]')
    const html = result.toString().replace(/\s+/g, ' ')
    expect(html.startsWith('<button')).toBe(true)
    expect(html).not.toContain('<p>')
  })

  it('unwraps if directives from paragraphs', () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'p',
          properties: {},
          children: [
            {
              type: 'element',
              tagName: 'if',
              properties: { test: 'true', content: '[]' },
              children: []
            }
          ]
        }
      ]
    }
    rehypeCampfire()(tree)
    const first = tree.children[0] as any
    expect(first.tagName).toBe('if')
  })

  it('unwraps show directives from paragraphs', () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'p',
          properties: {},
          children: [
            {
              type: 'element',
              tagName: 'show',
              properties: { 'data-key': 'hp' },
              children: []
            }
          ]
        }
      ]
    }
    rehypeCampfire()(tree)
    const first = tree.children[0] as any
    expect(first.tagName).toBe('show')
  })

  it('unwraps else directives from paragraphs', () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'p',
          properties: {},
          children: [
            {
              type: 'element',
              tagName: 'else',
              properties: { content: '[]' },
              children: []
            }
          ]
        }
      ]
    }
    rehypeCampfire()(tree)
    const first = tree.children[0] as any
    expect(first.tagName).toBe('else')
  })

  it('unwraps input directives from paragraphs', () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'p',
          properties: {},
          children: [
            { type: 'element', tagName: 'input', properties: {}, children: [] }
          ]
        }
      ]
    }
    rehypeCampfire()(tree)
    const first = tree.children[0] as any
    expect(first.tagName).toBe('input')
  })

  it('unwraps checkbox directives from paragraphs', () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'p',
          properties: {},
          children: [
            {
              type: 'element',
              tagName: 'checkbox',
              properties: {},
              children: []
            }
          ]
        }
      ]
    }
    rehypeCampfire()(tree)
    const first = tree.children[0] as any
    expect(first.tagName).toBe('checkbox')
  })

  it('unwraps radio directives from paragraphs', () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'p',
          properties: {},
          children: [
            { type: 'element', tagName: 'radio', properties: {}, children: [] }
          ]
        }
      ]
    }
    rehypeCampfire()(tree)
    const first = tree.children[0] as any
    expect(first.tagName).toBe('radio')
  })

  it('unwraps options within select directives', () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'select',
          properties: { stateKey: 'color' },
          children: [
            {
              type: 'element',
              tagName: 'p',
              properties: {},
              children: [{ type: 'text', value: 'color' }]
            },
            {
              type: 'element',
              tagName: 'p',
              properties: {},
              children: [
                {
                  type: 'element',
                  tagName: 'option',
                  properties: { value: 'red' },
                  children: [{ type: 'text', value: 'Red' }]
                },
                {
                  type: 'element',
                  tagName: 'option',
                  properties: { value: 'blue' },
                  children: [{ type: 'text', value: 'Blue' }]
                }
              ]
            }
          ]
        }
      ]
    }
    rehypeCampfire()(tree)
    const select = tree.children[0] as any
    expect(select.children).toHaveLength(2)
    expect(select.children[0].tagName).toBe('option')
    expect(select.children[1].tagName).toBe('option')
  })

  it('unwraps paragraphs inside if directive content', () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'if',
          properties: {
            test: 'true',
            content: JSON.stringify([
              {
                type: 'paragraph',
                children: [{ type: 'text', value: 'You chose' }]
              }
            ])
          },
          children: []
        }
      ]
    }
    rehypeCampfire()(tree)
    const first = tree.children[0] as any
    const content = JSON.parse(first.properties.content)
    expect(content).toHaveLength(1)
    expect(content[0].type).toBe('text')
    expect(content[0].value).toBe('You chose')
  })

  it('processes directives within if content', () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'if',
          properties: {
            test: 'x === 1',
            content: JSON.stringify([
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'element',
                    tagName: 'show',
                    properties: { style: 'color:red' },
                    children: [{ type: 'text', value: 'color' }]
                  },
                  { type: 'text', value: '.' }
                ]
              }
            ])
          },
          children: []
        }
      ]
    }
    rehypeCampfire()(tree)
    const first = tree.children[0] as any
    const content = JSON.parse(first.properties.content)
    expect(content).toHaveLength(2)
    expect(content[0].tagName).toBe('show')
    expect(content[1].value).toBe('.')
  })

  it('unwraps paragraphs inside if directive fallback', () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'if',
          properties: {
            test: 'false',
            fallback: JSON.stringify([
              {
                type: 'paragraph',
                children: [{ type: 'text', value: 'Flag is false' }]
              }
            ])
          },
          children: []
        }
      ]
    }
    rehypeCampfire()(tree)
    const first = tree.children[0] as any
    const fallback = JSON.parse(first.properties.fallback)
    expect(fallback).toHaveLength(1)
    expect(fallback[0].type).toBe('text')
    expect(fallback[0].value).toBe('Flag is false')
  })
})
