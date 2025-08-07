import { describe, it, expect } from 'bun:test'
import { unified } from 'unified'
import { VFile } from 'vfile'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkCampfire, { type DirectiveHandler } from '../index'
import type { DirectiveNode } from '../helpers'

/**
 * Parses markdown containing a directive and returns the directive node.
 *
 * @param md - Markdown string to process.
 * @param name - Directive name to capture.
 * @returns The parsed directive node.
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
  const tree = processor.parse(md)
  processor.runSync(tree, new VFile(md))
  return captured
}

describe('i18n directive attribute quoting', () => {
  it('accepts quoted locale in lang', () => {
    const node = parseDirective(':lang{locale="fr"}', 'lang')
    expect(node?.attributes).toEqual({ locale: 'fr' })
  })

  it('rejects unquoted locale in lang', () => {
    const orig = console.error
    const logs: unknown[] = []
    console.error = (...args: unknown[]) => {
      logs.push(args.join(' '))
    }
    const node = parseDirective(':lang{locale=fr}', 'lang')
    expect(node?.attributes).toEqual({})
    expect(logs.some(l => typeof l === 'string' && l.includes('CF002'))).toBe(
      true
    )
    console.error = orig
  })

  it('accepts quoted ns in t', () => {
    const node = parseDirective(':t{key=hello ns="ui"}', 't')
    expect(node?.attributes).toEqual({ key: 'hello', ns: 'ui' })
  })

  it('rejects unquoted ns in t', () => {
    const orig = console.error
    const logs: unknown[] = []
    console.error = (...args: unknown[]) => {
      logs.push(args.join(' '))
    }
    const node = parseDirective(':t{key=hello ns=ui}', 't')
    expect(node?.attributes).toEqual({ key: 'hello' })
    expect(logs.some(l => typeof l === 'string' && l.includes('CF003'))).toBe(
      true
    )
    console.error = orig
  })

  it('accepts quoted ns and locale in translations', () => {
    const node = parseDirective(
      ':translations{ns="ui" locale="fr" hello="bonjour"}',
      'translations'
    )
    expect(node?.attributes).toEqual({
      ns: 'ui',
      locale: 'fr',
      hello: 'bonjour'
    })
  })

  it('rejects unquoted ns and locale in translations', () => {
    const orig = console.error
    const logs: unknown[] = []
    console.error = (...args: unknown[]) => {
      logs.push(args.join(' '))
    }
    const node = parseDirective(
      ':translations{ns=ui locale=fr hello="bonjour"}',
      'translations'
    )
    expect(node?.attributes).toEqual({ hello: 'bonjour' })
    expect(logs.some(l => typeof l === 'string' && l.includes('CF002'))).toBe(
      true
    )
    expect(logs.some(l => typeof l === 'string' && l.includes('CF003'))).toBe(
      true
    )
    console.error = orig
  })
})
