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

describe('remarkCampfire if conditions', () => {
  it('renders content when if condition is true', async () => {
    const processor = createProcessor()

    const md = '::set{health=10}\n\n:::if[health > 5]\nhello\n:::'
    const result = await processor.process(md)
    expect(result.toString().trim()).toBe('<p>hello</p>')
  })

  it('supports elseif and else branches', async () => {
    const processor = createProcessor()

    const md =
      '::set{health=3}\n\n:::if[health > 5]\nhigh\n:::elseif[health > 1]\nmed\n:::else\nlow\n:::'
    const result = await processor.process(md)
    expect(result.toString().trim()).toBe('<p>med</p>')
  })

  it('allows modifying game state inside an if block', async () => {
    const processor = createProcessor()

    const md =
      '::set{health=5}\n\n:::if[health < 10]\n::set{health=20}\n:::\n:get[health]'
    const result = await processor.process(md)
    expect(result.toString().trim()).toBe('<p>20</p>')
    expect(useGameStore.getState().gameData.health).toBe('20')
  })

  it("doesn't modify game state when if condition is false", async () => {
    const processor = createProcessor()

    const md =
      '::set{health=5}\n\n:::if[health > 10]\n::set{health=20}\n:::\n:get[health]'
    const result = await processor.process(md)
    expect(result.toString().trim()).toBe('<p>5</p>')
    expect(useGameStore.getState().gameData.health).toBe('5')
  })

  it('evaluates && in if conditions', async () => {
    const processor = createProcessor()

    const md =
      '::set{health=8 mana=10}\n\n:::if[health > 5 && mana > 5]\npass\n:::'
    const result = await processor.process(md)
    expect(result.toString().trim()).toBe('<p>pass</p>')
  })

  it('evaluates || in elseif conditions', async () => {
    const processor = createProcessor()

    const md =
      '::set{health=2 mana=1}\n\n:::if[health > 5]\nA\n:::elseif[health > 1 || mana > 5]\nB\n:::else\nC\n:::'
    const result = await processor.process(md)
    expect(result.toString().trim()).toBe('<p>B</p>')
  })

  it('compares two state values in an if condition', async () => {
    const processor = createProcessor()

    const md =
      '::set{health=5 mana=7}\n\n:::if[mana > health]\npass\n:::else\nfail\n:::'
    const result = await processor.process(md)
    expect(result.toString().trim()).toBe('<p>pass</p>')
  })

  it('compares more than two state values', async () => {
    const processor = createProcessor()

    const md =
      '::set{health=3 mana=5 stamina=4}\n\n:::if[mana > stamina && stamina > health]\npass\n:::else\nfail\n:::'
    const result = await processor.process(md)
    expect(result.toString().trim()).toBe('<p>pass</p>')
  })

  it('handles objects in state and compares their properties', async () => {
    const processor = createProcessor()

    useGameStore.getState().setGameData({
      player: { stats: { hp: 7 } }
    })

    const md = ':::if[player.stats.hp === 7]\npass\n:::else\nfail\n:::'
    const result = await processor.process(md)
    expect(result.toString().trim()).toBe('<p>pass</p>')
  })

  it('calls functions stored in game state with other state values', async () => {
    const processor = createProcessor()

    useGameStore.getState().setGameData({
      name: 'world',
      greet: (n: string) => `Hello, ${n}!`
    })

    const result = await processor.process(':get[greet(name)]')
    expect(result.toString().trim()).toBe('<p>Hello, world!</p>')
  })

  it('calls functions stored in state and compares the result', async () => {
    const processor = createProcessor()

    useGameStore.getState().setGameData({
      getScore: () => 7
    })

    const md = ':::if[getScore() > 5]\npass\n:::else\nfail\n:::'
    const result = await processor.process(md)
    expect(result.toString().trim()).toBe('<p>pass</p>')
  })

  it('compares function results with other state values', async () => {
    const processor = createProcessor()

    useGameStore.getState().setGameData({
      base: 3,
      addFive: (n: number) => n + 5
    })

    const md = ':::if[addFive(base) === 8]\npass\n:::else\nfail\n:::'
    const result = await processor.process(md)
    expect(result.toString().trim()).toBe('<p>pass</p>')
  })
})
