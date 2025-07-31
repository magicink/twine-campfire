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

describe('remarkCampfire setOnce directive', () => {
  it('prevents future sets of the same key', async () => {
    const processor = createProcessor()
    const md = '::setOnce{health=10}\n::set{health=20}\n:get[health]'
    const result = await processor.process(md)
    expect(result.toString().trim()).toBe('<p>10</p>')
    expect(useGameStore.getState().gameData.health).toBe('10')
  })

  it('allows setting again after unset', async () => {
    const processor = createProcessor()
    const md =
      '::setOnce{health=10}\n::unset{key="health"}\n::set{health=5}\n:get[health]'
    const result = await processor.process(md)
    expect(result.toString().trim()).toBe('<p>5</p>')
    expect(useGameStore.getState().gameData.health).toBe('5')
  })
})
