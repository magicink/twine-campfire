import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkCampfire from '@/packages/remark-campfire'
import { handlers } from '../src/directives/handleDirective'
import { useGameStore } from '@/packages/use-game-store'

const createProcessor = (stringify = true) => {
  const processor = unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkCampfire, { handlers })
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

describe('directive handlers', () => {
  it('sets and gets values from the game store', async () => {
    const processor = createProcessor()
    const result = await processor.process('::set{health=10}\n:get[health]')
    expect(result.toString().trim()).toBe('<p>10</p>')
  })

  it('increments numeric values', async () => {
    const processor = createProcessor()
    const md =
      '::set[number]{score=5}\n::increment{key="score" amount=3}\n:get[score]'
    const result = await processor.process(md)
    expect(result.toString().trim()).toBe('<p>8</p>')
  })

  it('resolves if/else blocks based on game state', async () => {
    const processor = createProcessor()
    const md = '::set{health=3}\n\n:::if[health > 5]\nhigh\n:::else\nlow\n:::'
    const result = await processor.process(md)
    expect(result.toString().trim()).toBe('<p>low</p>')
  })
})
