import { describe, it, expect } from 'bun:test'
import { unified } from 'unified'
import { VFile } from 'vfile'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkCampfire, {
  type DirectiveHandler,
  type DirectiveNode
} from '../index'

type DirectiveName =
  | 'checkpoint'
  | 'save'
  | 'load'
  | 'clearSave'
  | 'image'
  | 'slide'

const parse = (name: DirectiveName, md: string) => {
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

describe('id attribute quoting', () => {
  const directives: DirectiveName[] = [
    'checkpoint',
    'save',
    'load',
    'clearSave',
    'image',
    'slide'
  ]
  for (const name of directives) {
    const open = name === 'slide' ? ':::' : ':'
    const close = name === 'slide' ? '\n:::' : ''
    it(`accepts quoted id for ${name}`, () => {
      const { node } = parse(name, `${open}${name}{id="cp1"}${close}`)
      expect(node?.attributes).toEqual({ id: 'cp1' })
    })

    it(`accepts unquoted state key for ${name}`, () => {
      const { node, file } = parse(name, `${open}${name}{id=cp.id}${close}`)
      expect(node?.attributes).toEqual({ id: 'cp.id' })
      expect(file.messages).toHaveLength(0)
    })

    it(`rejects unquoted literal id for ${name}`, () => {
      const { node, file } = parse(name, `${open}${name}{id=cp1}${close}`)
      expect(node?.attributes).toEqual({})
      expect(
        file.messages.some(m =>
          m.message.includes('id must be a quoted string')
        )
      ).toBe(true)
    })
  }
})
