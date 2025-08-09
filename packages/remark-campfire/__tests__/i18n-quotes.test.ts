import { describe, it, expect } from 'bun:test'
import { unified } from 'unified'
import { VFile } from 'vfile'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkCampfire, { type DirectiveHandler } from '../index'
import type { DirectiveNode } from '../helpers'

/**
 * Parses markdown containing a directive and returns the directive node and file.
 *
 * @param md - Markdown string to process.
 * @param name - Directive name to capture.
 * @returns The parsed directive node and VFile.
 */
const parseDirective = (md: string, name: string) => {
  let captured: DirectiveNode | undefined
  const handler: DirectiveHandler = directive => {
    captured = directive
  }
  const processor = unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkCampfire, { handlers: { [name]: handler } })
  const file = new VFile(md)
  const tree = processor.parse(md)
  processor.runSync(tree, file)
  return { node: captured, file }
}

describe('i18n directive attribute quoting', () => {
  it('accepts quoted locale in lang', () => {
    const { node } = parseDirective(':lang{locale="fr"}', 'lang')
    expect(node?.attributes).toEqual({ locale: 'fr' })
  })

  it('rejects unquoted locale in lang', () => {
    const { node, file } = parseDirective(':lang{locale=fr}', 'lang')
    expect(node?.attributes).toEqual({})
    expect(file.messages.some(m => m.message.includes('CF002'))).toBe(true)
  })

  it('accepts quoted ns in t', () => {
    const { node } = parseDirective(':t{key=hello ns="ui"}', 't')
    expect(node?.attributes).toEqual({ key: 'hello', ns: 'ui' })
  })

  it('rejects unquoted ns in t', () => {
    const { node, file } = parseDirective(':t{key=hello ns=ui}', 't')
    expect(node?.attributes).toEqual({ key: 'hello' })
    expect(file.messages.some(m => m.message.includes('CF003'))).toBe(true)
  })
})
