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
})
