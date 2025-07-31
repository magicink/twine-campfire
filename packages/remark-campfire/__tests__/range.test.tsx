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

describe('remarkCampfire range type', () => {
  it('stores range objects and clamps numbers', async () => {
    const processor = createProcessor()
    const md = `::set[range]{hp='{"lower":0,"upper":10,"value":5}'}\n::set[number]{hp=15}\n:get[hp]`
    const result = await processor.process(md)
    expect(result.toString().trim()).toBe('<p>10</p>')
    expect(useGameStore.getState().gameData.hp).toEqual({
      lower: 0,
      upper: 10,
      value: 10
    })
  })

  it('clamps values below the lower bound', async () => {
    const processor = createProcessor()
    const md = `::set[range]{hp='{"lower":0,"upper":10,"value":5}'}\n::set[number]{hp=-2}\n:get[hp]`
    const result = await processor.process(md)
    expect(result.toString().trim()).toBe('<p>0</p>')
    expect(useGameStore.getState().gameData.hp).toEqual({
      lower: 0,
      upper: 10,
      value: 0
    })
  })

  it('returns numeric values when getting a range', async () => {
    const processor = createProcessor()
    await processor.process(
      `::set[range]{energy='{"lower":0,"upper":5,"value":3}'}`
    )
    const result = await processor.process(':get[energy]')
    expect(result.toString().trim()).toBe('<p>3</p>')
  })
})
