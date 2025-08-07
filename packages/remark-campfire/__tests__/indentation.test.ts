import { describe, it, expect } from 'bun:test'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkStringify from 'remark-stringify'
import remarkCampfire, {
  remarkCampfireIndentation,
  type DirectiveHandler
} from '../index'

/**
 * Replaces the directive with an "X" while preserving indentation.
 *
 * @param directive - Directive node being processed.
 * @param parent - Parent node containing the directive.
 * @param index - Index of the directive within its parent.
 */
const testHandler: DirectiveHandler = (directive, parent, index) => {
  if (!parent || typeof index !== 'number') return
  const indent =
    (directive.data as { indentation?: string } | undefined)?.indentation || ''
  parent.children.splice(index, 1, { type: 'text', value: `${indent}X` })
}

/**
 * Processes markdown using remarkCampfire and the test handler.
 *
 * @param md - Markdown string to process.
 * @returns The processed markdown as a string.
 */
const processMarkdown = (md: string) => {
  const processor = unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkCampfireIndentation)
    .use(remarkCampfire, { handlers: { test: testHandler } })
    .use(remarkStringify)
  return processor.processSync(md).toString()
}

describe('remarkCampfire indentation', () => {
  it('preserves indentation inside list items', () => {
    const md = `- item\n  :test\n  after`
    const out = processMarkdown(md).trim()
    expect(out).toBe('* item\n  X\n  after')
  })

  it('preserves indentation inside blockquotes', () => {
    const md = `> quote\n> :test\n> after`
    const out = processMarkdown(md).trim()
    expect(out).toBe('> quote\n> X\n> after')
  })
})
