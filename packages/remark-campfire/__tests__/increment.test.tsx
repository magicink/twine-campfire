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

describe('remarkCampfire increment and decrement directives', () => {
  it('increments numeric values', async () => {
    const processor = createProcessor()
    const md =
      '::set[number]{score=5}\n::increment{variable="score" amount=3}\n:get[score]'
    const result = await processor.process(md)
    expect(result.toString().trim()).toBe('<p>8</p>')
    expect(useGameStore.getState().gameData.score).toBe(8)
  })

  it('decrements numeric values', async () => {
    const processor = createProcessor()
    const md =
      '::set[number]{health=10}\n::decrement{variable="health" amount=4}\n:get[health]'
    const result = await processor.process(md)
    expect(result.toString().trim()).toBe('<p>6</p>')
    expect(useGameStore.getState().gameData.health).toBe(6)
  })

  it('clamps range values when applying changes', async () => {
    const processor = createProcessor()
    const md = `::set[range]{hp='{"lower":0,"upper":10,"value":5}'}\n::decrement{variable="hp" amount=7}\n:get[hp]`
    const result = await processor.process(md)
    expect(result.toString().trim()).toBe('<p>0</p>')
    expect(useGameStore.getState().gameData.hp).toEqual({
      lower: 0,
      upper: 10,
      value: 0
    })
  })
})
