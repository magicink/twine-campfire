import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkCampfire from '../index'
import { useGameStore } from '@/packages/use-game-store'

function createProcessor(stringify = true) {
  const processor = (unified() as any)
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkCampfire)
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

describe('remarkCampfire basic directives', () => {
  it('sets and gets values from the game store', async () => {
    const processor = createProcessor()

    const result = await processor.process('::set{health=10}\n:get[health]')
    expect(result.toString().trim()).toBe('<p>10</p>')
  })

  it('returns empty string for unknown keys', async () => {
    const processor = createProcessor()

    const result = await processor.process(':get[missing]')
    expect(result.toString()).toBe('<p></p>')
  })
})
