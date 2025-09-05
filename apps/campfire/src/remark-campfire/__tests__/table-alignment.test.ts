import { describe, it, expect } from 'bun:test'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkCampfire, { type DirectiveHandler } from '../index'

/**
 * Replaces directive with an "X" to test table rendering.
 *
 * @param directive - Directive node being processed.
 * @param parent - Parent node containing the directive.
 * @param index - Index of the directive within its parent.
 */
const replaceWithX: DirectiveHandler = (_directive, parent, index) => {
  if (!parent || typeof index !== 'number') return
  parent.children.splice(index, 1, { type: 'text', value: 'X' })
}

/**
 * Converts markdown to HTML with remarkCampfire.
 *
 * @param md - Markdown string to process.
 * @returns HTML output as string.
 */
const render = (md: string) =>
  unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkCampfire, { handlers: { test: replaceWithX } })
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(md)
    .toString()

describe('remarkCampfire table alignment', () => {
  it('preserves alignment when directives appear in table cells', () => {
    const md = `| Stat | Value |\n| :--- | ---: |\n| HP | :test[] |`
    const html = render(md)
    expect(html).toContain('<th align="left">Stat</th>')
    expect(html).toContain('<th align="right">Value</th>')
    expect(html).toContain('<td align="left">HP</td>')
    expect(html).toContain('<td align="right">X</td>')
  })
})
