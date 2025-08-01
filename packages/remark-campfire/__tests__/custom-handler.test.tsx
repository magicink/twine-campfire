import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkCampfire, { type RemarkCampfireOptions } from '../index'
import { handlers } from './handlers'
import { useGameStore } from '@/packages/use-game-store'

const createProcessor = (opts: RemarkCampfireOptions, stringify = true) => {
  const processor = (unified() as any)
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkCampfire, opts)
    .use(remarkRehype)

  if (stringify) {
    processor.use(rehypeStringify)
  }

  return processor
}

beforeEach(() => {
  useGameStore.setState({ gameData: {}, _initialGameData: {}, locale: 'en-US' })
})

afterEach(() => {
  useGameStore.setState({ gameData: {}, _initialGameData: {}, locale: 'en-US' })
})

describe('remarkCampfire custom handlers', () => {
  it('uses a custom handler when provided', async () => {
    const customGet = (directive: any, parent: any, index: any) => {
      if (parent && typeof index === 'number') {
        parent.children.splice(index, 1, { type: 'text', value: 'CUSTOM' })
        return index
      }
    }
    const processor = createProcessor({
      handlers: { ...handlers, get: customGet }
    })
    const result = await processor.process(':get[any]')
    expect(result.toString().trim()).toBe('<p>CUSTOM</p>')
  })
})
