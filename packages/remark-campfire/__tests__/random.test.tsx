import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkCampfire from '../index'
import { handlers } from './handlers'
import { useGameStore } from '@/packages/use-game-store'

const createProcessor = (stringify = true) => {
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

describe('remarkCampfire random directive', () => {
  it('generates a random number within the range', async () => {
    const processor = createProcessor()
    const originalRandom = Math.random
    Math.random = () => 0.5
    const md = '::random{key="roll" min=1 max=10}\n:get[roll]'
    const result = await processor.process(md)
    Math.random = originalRandom
    expect(result.toString().trim()).toBe('<p>6</p>')
    expect(useGameStore.getState().gameData.roll).toBe(6)
  })

  it('selects a value from a list', async () => {
    const processor = createProcessor()
    const originalRandom = Math.random
    Math.random = () => 0.25
    const md =
      '::random{key="loot" options="gold,silver,gems,artifact"}\n:get[loot]'
    const result = await processor.process(md)
    Math.random = originalRandom
    expect(result.toString().trim()).toBe('<p>silver</p>')
    expect(useGameStore.getState().gameData.loot).toBe('silver')
  })
})
