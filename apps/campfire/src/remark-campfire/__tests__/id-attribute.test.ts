import { describe, it, expect } from 'bun:test'
import { unified } from 'unified'
import { VFile } from 'vfile'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkCampfire, { type DirectiveHandler } from '../index'
import type { TextDirective } from 'mdast-util-directive'

type DirectiveName = 'checkpoint' | 'save' | 'load' | 'clearSave'

const parse = (name: DirectiveName, md: string) => {
  let captured: TextDirective | undefined
  const handler: DirectiveHandler = directive => {
    captured = directive as TextDirective
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

describe('id attribute quoting', () => {
  const directives: DirectiveName[] = [
    'checkpoint',
    'save',
    'load',
    'clearSave'
  ]
  for (const name of directives) {
    it(`accepts quoted id for ${name}`, () => {
      const { node } = parse(name, `:${name}{id="cp1"}`)
      expect(node?.attributes).toEqual({ id: 'cp1' })
    })

    it(`accepts unquoted state key for ${name}`, () => {
      const { node, file } = parse(name, `:${name}{id=cp.id}`)
      expect(node?.attributes).toEqual({ id: 'cp.id' })
      expect(file.messages).toHaveLength(0)
    })

    it(`rejects unquoted literal id for ${name}`, () => {
      const { node, file } = parse(name, `:${name}{id=cp1}`)
      expect(node?.attributes).toEqual({})
      expect(
        file.messages.some(m =>
          m.message.includes('id must be a quoted string')
        )
      ).toBe(true)
    })
  }
})
