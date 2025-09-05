import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, waitFor } from '@testing-library/preact'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { useGameStore } from '@campfire/state/useGameStore'
import { resetStores } from '@campfire/test-utils/helpers'

describe('Passage game state directives', () => {
  beforeEach(async () => {
    document.body.innerHTML = ''
    resetStores()
    if (!i18next.isInitialized) {
      await i18next.use(initReactI18next).init({ lng: 'en-US', resources: {} })
    } else {
      await i18next.changeLanguage('en-US')
      i18next.services.resourceStore.data = {}
    }
  })

  it('executes the set directive', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: '::set[hp=5]' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() =>
      expect(
        (useGameStore.getState().gameData as Record<string, unknown>).hp
      ).toBe(5)
    )
  })

  it('sets string values only when quoted', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: '::set[item="sword"]'
        }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() =>
      expect(
        (useGameStore.getState().gameData as Record<string, unknown>).item
      ).toBe('sword')
    )
  })

  it('ignores unquoted string values', () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: '::set[item=sword]' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).item
    ).toBeUndefined()
  })

  it('removes paragraphs left empty by directives', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: '::set[hp=5]\n\nHello'
        }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await screen.findByText('Hello')

    const paragraphs = document.querySelectorAll('p')
    expect(paragraphs).toHaveLength(1)
  })

  it('supports shorthand syntax for set directive', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            '::set[hp=5]\n::set[name="John"]\n::set[isActive=true]\n::set[double=hp*2]\n'
        }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      const data = useGameStore.getState().gameData as Record<string, unknown>
      expect(data.hp).toBe(5)
      expect(data.name).toBe('John')
      expect(data.isActive).toBe(true)
      expect(data.double).toBe(10)
    })
  })

  it('evaluates expressions in set directive', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { key_1: 1, key_b: 2, key_c: 3 }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: '::set[num=(key_1+key_b) * key_c]' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => expect(useGameStore.getState().gameData.num).toBe(9))
  })

  it('creates range values', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: '::createRange[hp=5]{min=0 max=10}' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() =>
      expect(useGameStore.getState().gameData.hp).toEqual({
        min: 0,
        max: 10,
        value: 5
      })
    )
  })

  it('clamps values in setRange directive', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: '::createRange[hp=5]{min=0 max=10}\n::setRange[hp=20]\n'
        }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() =>
      expect(useGameStore.getState().gameData.hp).toEqual({
        min: 0,
        max: 10,
        value: 10
      })
    )
  })

  it('batches state updates into one change', async () => {
    const unsetCalls: string[] = []
    const origUnset = useGameStore.getState().unsetGameData
    useGameStore.setState({
      unsetGameData: key => {
        unsetCalls.push(String(key))
        origUnset(key)
      }
    })
    useGameStore.getState().init({})
    useGameStore.getState().setGameData({ items: [], old: true })
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            '\n:::batch\n::set[visited=true]\n::push{key=items value=sword}\n::unset[old]\n:::\n\n'
        }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      const data = useGameStore.getState().gameData as Record<string, unknown>
      expect(data.items).toEqual(['sword'])
      expect(data.visited).toBe(true)
      expect('old' in data).toBe(false)
    })
    expect(useGameStore.getState().lockedKeys.visited).toBeUndefined()
    expect(unsetCalls).toEqual(['old'])
    useGameStore.setState({ unsetGameData: origUnset })
  })

  it('handles random directives inside batch blocks', async () => {
    useGameStore.getState().init({})
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':::batch\n::random[roll]{min=1 max=6}\n:::'
        }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      const data = useGameStore.getState().gameData as Record<string, unknown>
      expect(data.roll).toBeGreaterThanOrEqual(1)
      expect(data.roll).toBeLessThanOrEqual(6)
    })
  })

  it('locks keys with randomOnce inside batch blocks', async () => {
    useGameStore.getState().init({})
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':::batch\n::randomOnce[foo]{min=1 max=2}\n:::'
        }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      const { gameData, lockedKeys } = useGameStore.getState()
      const value = (gameData as Record<string, unknown>).foo as number
      expect([1, 2]).toContain(value)
      expect(lockedKeys.foo).toBe(true)
      useGameStore.getState().setGameData({ foo: 5 })
      expect(
        (useGameStore.getState().gameData as Record<string, unknown>).foo
      ).toBe(value)
    })
  })

  it('ignores nested batch directives', async () => {
    const logged: unknown[] = []
    const orig = console.error
    console.error = (...args: unknown[]) => {
      logged.push(args)
    }

    useGameStore.getState().init({})
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':::batch\n::set[a=1]\n:::batch\n::set[a=2]\n:::\n:::'
        }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      expect(
        (useGameStore.getState().gameData as Record<string, unknown>).a
      ).toBe(1)
      expect(useGameStore.getState().errors).toEqual([
        'Nested batch directives are not allowed'
      ])
      expect(logged).toHaveLength(1)
    })

    console.error = orig
  })

  it('logs error for non-data directives in batch blocks', async () => {
    const logged: unknown[] = []
    const orig = console.error
    console.error = (...args: unknown[]) => {
      logged.push(args)
    }

    useGameStore.getState().init({})
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':::batch\n::goto[Two]\n:::' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      expect(useGameStore.getState().errors).toEqual([
        'batch only supports directives: set, setOnce, array, arrayOnce, createRange, setRange, unset, random, randomOnce, push, pop, shift, unshift, splice, concat, checkpoint, loadCheckpoint, clearCheckpoint, save, load, clearSave, lang, translations, if, for'
      ])
      expect(logged).toHaveLength(1)
    })

    console.error = orig
  })
  it('locks keys with setOnce', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: '::setOnce[gold=10]'
        }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() =>
      expect(
        (useGameStore.getState().gameData as Record<string, unknown>).gold
      ).toBe(10)
    )
    expect(useGameStore.getState().lockedKeys.gold).toBe(true)

    useGameStore.getState().setGameData({ gold: 5 })

    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).gold
    ).toBe(10)
  })

  it('locks keys with setOnce shorthand', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: '::setOnce[coins=10]' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() =>
      expect(
        (useGameStore.getState().gameData as Record<string, unknown>).coins
      ).toBe(10)
    )
    expect(useGameStore.getState().lockedKeys.coins).toBe(true)

    useGameStore.getState().setGameData({ coins: 5 })

    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).coins
    ).toBe(10)
  })

  it('sets arrays with array directive', async () => {
    useGameStore.setState(state => ({ ...state, gameData: { base: 2 } }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: "::array[items=[1,'two',false,base+3]]"
        }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() =>
      expect(useGameStore.getState().gameData.items).toEqual([
        1,
        'two',
        false,
        5
      ])
    )
  })

  it('locks keys with arrayOnce', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: '::arrayOnce[nums=[1,2]]' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() =>
      expect(useGameStore.getState().gameData.nums).toEqual([1, 2])
    )
    expect(useGameStore.getState().lockedKeys.nums).toBe(true)

    useGameStore.getState().setGameData({ nums: [3] })

    expect(useGameStore.getState().gameData.nums).toEqual([1, 2])
  })

  it('pops items with pop directive', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { items: ['a', 'b', 'c'] }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: '::pop{key=items}' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() =>
      expect(useGameStore.getState().gameData.items).toEqual(['a', 'b'])
    )
  })

  it('shifts items with shift directive', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { items: ['a', 'b', 'c'] }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: '::shift{key=items}' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() =>
      expect(useGameStore.getState().gameData.items).toEqual(['b', 'c'])
    )
  })
  it('pushes items with push directive', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { items: ['a', 'b', 'c'] }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: '::push{key=items value=d}' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() =>
      expect(useGameStore.getState().gameData.items).toEqual([
        'a',
        'b',
        'c',
        'd'
      ])
    )
  })

  it('unshifts items with unshift directive', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { items: ['a', 'b', 'c'] }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: '::unshift{key=items value=z}' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() =>
      expect(useGameStore.getState().gameData.items).toEqual([
        'z',
        'a',
        'b',
        'c'
      ])
    )
  })

  it('splices items with splice directive', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { items: ['a', 'b', 'c', 'd'] }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: '::splice{key=items index=1 count=2 value=x,y into=removed}'
        }
      ]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      const { gameData } = useGameStore.getState()
      expect(gameData.items).toEqual(['a', 'x', 'y', 'd'])
      expect(gameData.removed).toEqual(['b', 'c'])
    })
  })

  it('concats arrays with concat directive', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { items: ['a', 'b', 'c'], more: ['d', 'e'] }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: '::concat{key=items value=more}' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() =>
      expect(useGameStore.getState().gameData.items).toEqual([
        'a',
        'b',
        'c',
        'd',
        'e'
      ])
    )
  })

  it('stores a random item from an array with random directive', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { items: ['a', 'b', 'c'] }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: '::random[pick]{from=items}' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      const { gameData } = useGameStore.getState()
      expect(['a', 'b', 'c']).toContain(gameData.pick)
      expect(gameData.items).toEqual(['a', 'b', 'c'])
    })
  })

  it('stores a random integer within bounds with random directive', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: '::random[roll]{min=1 max=6}' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      const { gameData } = useGameStore.getState()
      expect(gameData.roll).toBeGreaterThanOrEqual(1)
      expect(gameData.roll).toBeLessThanOrEqual(6)
    })
  })

  it('logs error when mixing range and array in random directive', async () => {
    const logged: unknown[] = []
    const orig = console.error
    console.error = (...args: unknown[]) => {
      logged.push(args)
    }

    useGameStore.setState(state => ({
      ...state,
      gameData: { items: ['a', 'b'] }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        { type: 'text', value: '::random[pick]{from=items min=1 max=2}' }
      ]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      expect(
        (useGameStore.getState().gameData as Record<string, unknown>).pick
      ).toBeUndefined()
      expect(useGameStore.getState().errors).toEqual([
        'random accepts either "from" or "min"/"max", not both'
      ])
      expect(logged).toHaveLength(1)
    })

    console.error = orig
  })

  it('logs error when only one range bound is provided in random directive', async () => {
    const logged: unknown[] = []
    const orig = console.error
    console.error = (...args: unknown[]) => {
      logged.push(args)
    }

    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: '::random[roll]{min=1}' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      expect(
        (useGameStore.getState().gameData as Record<string, unknown>).roll
      ).toBeUndefined()
      expect(useGameStore.getState().errors).toEqual([
        'random requires both "min" and "max" when "from" is absent'
      ])
      expect(logged).toHaveLength(1)
    })

    console.error = orig
  })

  it('locks keys with randomOnce directive', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: '::randomOnce[foo]{min=1 max=2}' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      const { gameData, lockedKeys } = useGameStore.getState()
      const value = (gameData as Record<string, unknown>).foo as number
      expect([1, 2]).toContain(value)
      expect(lockedKeys.foo).toBe(true)
      useGameStore.getState().setGameData({ foo: 5 })
      expect(
        (useGameStore.getState().gameData as Record<string, unknown>).foo
      ).toBe(value)
    })
  })

  it('pops items from nested arrays with pop directive', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { bag: { items: ['a', 'b', 'c'] } }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: '::pop{key=bag.items}' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() =>
      expect((useGameStore.getState().gameData as any).bag.items).toEqual([
        'a',
        'b'
      ])
    )
  })

  it('shifts items from nested arrays with shift directive', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { bag: { items: ['a', 'b', 'c'] } }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: '::shift{key=bag.items}' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() =>
      expect((useGameStore.getState().gameData as any).bag.items).toEqual([
        'b',
        'c'
      ])
    )
  })

  it('pushes items into nested arrays with push directive', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { bag: { items: ['a', 'b'] } }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: '::push{key=bag.items value=c}' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() =>
      expect((useGameStore.getState().gameData as any).bag.items).toEqual([
        'a',
        'b',
        'c'
      ])
    )
  })

  it('unshifts items into nested arrays with unshift directive', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { bag: { items: ['b', 'c'] } }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: '::unshift{key=bag.items value=a}' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() =>
      expect((useGameStore.getState().gameData as any).bag.items).toEqual([
        'a',
        'b',
        'c'
      ])
    )
  })

  it('splices items in nested arrays with splice directive', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { bag: { items: ['a', 'b', 'c'] } }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: '::splice{key=bag.items index=1 count=1 value=x}'
        }
      ]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() =>
      expect((useGameStore.getState().gameData as any).bag.items).toEqual([
        'a',
        'x',
        'c'
      ])
    )
  })

  it('concats nested arrays with concat directive', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { bag: { items: ['a'], more: ['b', 'c'] } }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        { type: 'text', value: '::concat{key=bag.items value=bag.more}' }
      ]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() =>
      expect((useGameStore.getState().gameData as any).bag.items).toEqual([
        'a',
        'b',
        'c'
      ])
    )
  })

  it('renders game data with show directive', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { hp: 7 }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: 'HP: :show[hp]' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      expect(screen.getByText('HP: 7')).toBeInTheDocument()
      expect(screen.queryByTestId('show')).toBeNull()
    })
  })

  it('renders show directive inside a markdown table', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { hp: 7 }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: '| Stat | Value |\n| --- | --- |\n| HP | :show[hp] |'
        }
      ]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      const span = screen.getByText('7')
      expect(span.closest('tr')?.textContent?.replace(/\s+/g, '')).toBe('HP7')
    })
  })

  it('renders show directive with an expression', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { some_key: 2 }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: 'Value :show[some_key > 1 ? "X" : " "]'
        }
      ]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      expect(screen.getByText('Value X')).toBeInTheDocument()
      expect(screen.queryByTestId('show')).toBeNull()
    })
  })

  it('applies className and style attributes to show directive', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { hp: 7 }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: 'HP: :show[hp]{as="span" className="stat" style="color:blue"}'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    await waitFor(() => {
      const span = screen.getByText('7')
      expect(span.className).toContain('stat')
      expect(span).toHaveStyle('color: blue')
      expect(span.closest('p')?.textContent?.replace(/\s+/g, '')).toBe('HP:7')
    })
  })

  it('ignores className and style without as on show directive', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { hp: 7 }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: 'HP: :show[hp]{className="stat" style="color:blue"}'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    await waitFor(() => {
      expect(screen.queryByTestId('show')).toBeNull()
      expect(screen.getByText('HP: 7')).toBeInTheDocument()
    })
  })

  it('unsets game data with the unset directive', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { flag: true }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: '::unset[flag]' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() =>
      expect(
        (useGameStore.getState().gameData as Record<string, unknown>).flag
      ).toBeUndefined()
    )
  })

  describe('leaf state directives', () => {
    it('locks keys with setOnce', async () => {
      const passage: Element = {
        type: 'element',
        tagName: 'tw-passagedata',
        properties: { pid: '1', name: 'Start' },
        children: [{ type: 'text', value: '::setOnce[gold=10]' }]
      }
      useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
      render(<Passage />)
      await waitFor(() =>
        expect(
          (useGameStore.getState().gameData as Record<string, unknown>).gold
        ).toBe(10)
      )
      expect(useGameStore.getState().lockedKeys.gold).toBe(true)
      useGameStore.getState().setGameData({ gold: 5 })
      expect(
        (useGameStore.getState().gameData as Record<string, unknown>).gold
      ).toBe(10)
    })

    it('creates range values with createRange directive', async () => {
      const passage: Element = {
        type: 'element',
        tagName: 'tw-passagedata',
        properties: { pid: '1', name: 'Start' },
        children: [{ type: 'text', value: '::createRange[hp=5]{min=0 max=10}' }]
      }
      useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
      render(<Passage />)
      await waitFor(() =>
        expect(useGameStore.getState().gameData.hp).toEqual({
          min: 0,
          max: 10,
          value: 5
        })
      )
    })

    it('clamps values with setRange directive', async () => {
      const passage: Element = {
        type: 'element',
        tagName: 'tw-passagedata',
        properties: { pid: '1', name: 'Start' },
        children: [
          { type: 'text', value: '::createRange[hp=5]{min=0 max=10}\n' },
          { type: 'text', value: '::setRange[hp=20]' }
        ]
      }
      useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
      render(<Passage />)
      await waitFor(() =>
        expect(useGameStore.getState().gameData.hp).toEqual({
          min: 0,
          max: 10,
          value: 10
        })
      )
    })

    it('sets arrays with array directive', async () => {
      useGameStore.setState(state => ({ ...state, gameData: { base: 2 } }))
      const passage: Element = {
        type: 'element',
        tagName: 'tw-passagedata',
        properties: { pid: '1', name: 'Start' },
        children: [
          { type: 'text', value: "::array[items=[1,'two',false,base+3]]" }
        ]
      }
      useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
      render(<Passage />)
      await waitFor(() =>
        expect(useGameStore.getState().gameData.items).toEqual([
          1,
          'two',
          false,
          5
        ])
      )
    })

    it('locks arrays with arrayOnce directive', async () => {
      const passage: Element = {
        type: 'element',
        tagName: 'tw-passagedata',
        properties: { pid: '1', name: 'Start' },
        children: [{ type: 'text', value: '::arrayOnce[nums=[1,2]]' }]
      }
      useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
      render(<Passage />)
      await waitFor(() =>
        expect(useGameStore.getState().gameData.nums).toEqual([1, 2])
      )
      expect(useGameStore.getState().lockedKeys.nums).toBe(true)
      useGameStore.getState().setGameData({ nums: [3] })
      expect(useGameStore.getState().gameData.nums).toEqual([1, 2])
    })

    it('stores a random item with random directive', async () => {
      useGameStore.setState(state => ({
        ...state,
        gameData: { items: ['a', 'b', 'c'] }
      }))
      const passage: Element = {
        type: 'element',
        tagName: 'tw-passagedata',
        properties: { pid: '1', name: 'Start' },
        children: [{ type: 'text', value: '::random[pick]{from=items}' }]
      }
      useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
      render(<Passage />)
      await waitFor(() => {
        const { gameData } = useGameStore.getState()
        expect(['a', 'b', 'c']).toContain(gameData.pick)
        expect(gameData.items).toEqual(['a', 'b', 'c'])
      })
    })

    it('locks keys with randomOnce directive', async () => {
      const passage: Element = {
        type: 'element',
        tagName: 'tw-passagedata',
        properties: { pid: '1', name: 'Start' },
        children: [{ type: 'text', value: '::randomOnce[foo]{min=1 max=2}' }]
      }
      useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
      render(<Passage />)
      await waitFor(() =>
        expect(
          (useGameStore.getState().gameData as Record<string, unknown>).foo
        ).toBeGreaterThanOrEqual(1)
      )
      expect(useGameStore.getState().lockedKeys.foo).toBe(true)
    })

    it('pops items with pop directive', async () => {
      useGameStore.setState(state => ({
        ...state,
        gameData: { items: ['a', 'b', 'c'] }
      }))
      const passage: Element = {
        type: 'element',
        tagName: 'tw-passagedata',
        properties: { pid: '1', name: 'Start' },
        children: [{ type: 'text', value: '::pop{key=items}' }]
      }
      useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
      render(<Passage />)
      await waitFor(() =>
        expect(useGameStore.getState().gameData.items).toEqual(['a', 'b'])
      )
    })

    it('pushes items with push directive', async () => {
      useGameStore.setState(state => ({
        ...state,
        gameData: { items: ['a', 'b', 'c'] }
      }))
      const passage: Element = {
        type: 'element',
        tagName: 'tw-passagedata',
        properties: { pid: '1', name: 'Start' },
        children: [{ type: 'text', value: '::push{key=items value=d}' }]
      }
      useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
      render(<Passage />)
      await waitFor(() =>
        expect(useGameStore.getState().gameData.items).toEqual([
          'a',
          'b',
          'c',
          'd'
        ])
      )
    })

    it('shifts items with shift directive', async () => {
      useGameStore.setState(state => ({
        ...state,
        gameData: { items: ['a', 'b', 'c'] }
      }))
      const passage: Element = {
        type: 'element',
        tagName: 'tw-passagedata',
        properties: { pid: '1', name: 'Start' },
        children: [{ type: 'text', value: '::shift{key=items}' }]
      }
      useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
      render(<Passage />)
      await waitFor(() =>
        expect(useGameStore.getState().gameData.items).toEqual(['b', 'c'])
      )
    })

    it('unshifts items with unshift directive', async () => {
      useGameStore.setState(state => ({
        ...state,
        gameData: { items: ['a', 'b', 'c'] }
      }))
      const passage: Element = {
        type: 'element',
        tagName: 'tw-passagedata',
        properties: { pid: '1', name: 'Start' },
        children: [{ type: 'text', value: '::unshift{key=items value=z}' }]
      }
      useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
      render(<Passage />)
      await waitFor(() =>
        expect(useGameStore.getState().gameData.items).toEqual([
          'z',
          'a',
          'b',
          'c'
        ])
      )
    })

    it('splices items with splice directive', async () => {
      useGameStore.setState(state => ({
        ...state,
        gameData: { items: ['a', 'b', 'c', 'd'] }
      }))
      const passage: Element = {
        type: 'element',
        tagName: 'tw-passagedata',
        properties: { pid: '1', name: 'Start' },
        children: [
          {
            type: 'text',
            value: '::splice{key=items index=1 count=2 value=x,y into=removed}'
          }
        ]
      }
      useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
      render(<Passage />)
      await waitFor(() => {
        const { gameData } = useGameStore.getState()
        expect(gameData.items).toEqual(['a', 'x', 'y', 'd'])
        expect(gameData.removed).toEqual(['b', 'c'])
      })
    })

    it('concats arrays with concat directive', async () => {
      useGameStore.setState(state => ({
        ...state,
        gameData: { items: ['a', 'b', 'c'], more: ['d', 'e'] }
      }))
      const passage: Element = {
        type: 'element',
        tagName: 'tw-passagedata',
        properties: { pid: '1', name: 'Start' },
        children: [{ type: 'text', value: '::concat{key=items value=more}' }]
      }
      useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
      render(<Passage />)
      await waitFor(() =>
        expect(useGameStore.getState().gameData.items).toEqual([
          'a',
          'b',
          'c',
          'd',
          'e'
        ])
      )
    })
  })
})
