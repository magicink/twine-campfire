import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, waitFor } from '@testing-library/react'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Element } from 'hast'
import { Passage } from '../src/Passage'
import { useStoryDataStore } from '@/packages/use-story-data-store'
import { useGameStore } from '@/packages/use-game-store'
import { resetStores } from './helpers'

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
      children: [{ type: 'text', value: ':::set[number]{key=hp value=5}\n:::' }]
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

  it('removes paragraphs left empty by directives', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':::set[number]{key=hp value=5}\n:::\n\nHello'
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
            ':::batch\\n:set[boolean]{key=visited value=true}\\n:push{key=items value=sword}\\n:unset{key=old}\\n:::\n'
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
  it('locks keys with setOnce', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':setOnce[number]{key=gold value=10}'
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

  it('sets arrays with array directive', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':array[number]{nums=1,2,3}' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() =>
      expect(useGameStore.getState().gameData.nums).toEqual([1, 2, 3])
    )
  })

  it('locks keys with arrayOnce', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':arrayOnce[number]{nums=1,2}' }]
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
      children: [{ type: 'text', value: ':pop{key=items}' }]
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
      children: [{ type: 'text', value: ':shift{key=items}' }]
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
      children: [{ type: 'text', value: ':push{key=items value=d}' }]
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
      children: [{ type: 'text', value: ':unshift{key=items value=z}' }]
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
          value: ':splice{key=items index=1 count=2 value=x,y into=removed}'
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
      children: [{ type: 'text', value: ':concat{key=items value=more}' }]
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
      children: [{ type: 'text', value: ':random{key=pick from=items}' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      const { gameData } = useGameStore.getState()
      expect(['a', 'b', 'c']).toContain(gameData.pick)
      expect(gameData.items).toEqual(['a', 'b', 'c'])
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
      children: [{ type: 'text', value: ':pop{key=bag.items}' }]
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
      children: [{ type: 'text', value: ':shift{key=bag.items}' }]
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
      children: [{ type: 'text', value: ':push{key=bag.items value=c}' }]
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
      children: [{ type: 'text', value: ':unshift{key=bag.items value=a}' }]
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
          value: ':splice{key=bag.items index=1 count=1 value=x}'
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
        { type: 'text', value: ':concat{key=bag.items value=bag.more}' }
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

  it('evaluates defined directive', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { hp: 5, player: { name: 'Alex' } }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            'HP: :defined[hp] MP: :defined[mp] Name: :defined[player.name] Age: :defined[player.age]'
        }
      ]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      expect(
        screen.getByText('HP: true MP: false Name: true Age: false')
      ).toBeInTheDocument()
    })
  })

  it('requires a key and does not display results', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { x: 3 }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: 'Result: :math[x * 2]' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await screen.findByText('Result:')
    expect(screen.queryByText('Result: 6')).toBeNull()
    expect(useGameStore.getState().gameData.x).toBe(3)
  })

  it('can set state with math directive', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { hp: 5 }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: 'HP: :math[hp + 1]{key=hp} :show{key=hp}'
        }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      const span = screen.getByText('6')
      expect(span.closest('p')?.textContent?.replace(/\s+/g, '')).toBe('HP:6')
    })
    expect(useGameStore.getState().gameData.hp).toBe(6)
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
      children: [{ type: 'text', value: 'HP: :show{key=hp}' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      const span = screen.getByText('7')
      expect(span.closest('p')?.textContent?.replace(/\s+/g, '')).toBe('HP:7')
    })
  })

  it('creates range values with set[range]', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':set[range]{key=hp min=0 max=10 value=5}'
        }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      expect(useGameStore.getState().gameData.hp).toEqual({
        lower: 0,
        upper: 10,
        value: 5
      })
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
      children: [{ type: 'text', value: ':unset{key=flag}' }]
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
})
