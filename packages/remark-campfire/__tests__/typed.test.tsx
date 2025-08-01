import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkCampfire from '../index'
import { handlers } from './handlers'
import { useGameStore } from '@/packages/use-game-store'

function createProcessor(stringify = true) {
  const processor = (unified() as any)
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

describe('remarkCampfire typed set directive', () => {
  it('stores values as numbers when set with a type', async () => {
    const processor = createProcessor()

    await processor.process('::set[number]{level=5}')
    expect(useGameStore.getState().gameData.level).toBe(5)
  })

  it('defaults number values to 0 when parsing fails', async () => {
    const processor = createProcessor()

    await processor.process('::set[number]{level=NaN}')
    expect(useGameStore.getState().gameData.level).toBe(0)
  })

  it('stores values as booleans when set with a type', async () => {
    const processor = createProcessor()

    await processor.process('::set[boolean]{agree=true}')
    expect(useGameStore.getState().gameData.agree).toBe(true)
  })

  it('stores values as objects when set with a type', async () => {
    const processor = createProcessor()

    await processor.process(`::set[object]{player='{"hp":7}'}`)
    expect(useGameStore.getState().gameData.player).toEqual({ hp: 7 })
  })

  it('evaluates equations using current game state', async () => {
    const processor = createProcessor()

    const md =
      '::set[number]{base=7}\n::set[number]{total=base+3}\n:get[total*2]'
    const result = await processor.process(md)

    expect(result.toString().trim()).toBe('<p>20</p>')
    expect(useGameStore.getState().gameData.total).toBe(10)
  })
})
