import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, waitFor, act } from '@testing-library/react'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Element } from 'hast'
import { Passage } from '../src/Passage'
import { useStoryDataStore } from '@/packages/use-story-data-store'
import { useGameStore } from '@/packages/use-game-store'

const resetStore = () => {
  useStoryDataStore.setState({
    storyData: {},
    passages: [],
    currentPassageId: undefined
  })
  useGameStore.setState({
    gameData: {},
    _initialGameData: {},
    lockedKeys: {},
    onceKeys: {},
    checkpoints: {},
    errors: [],
    loading: false
  })
  localStorage.clear()
}

describe('Passage', () => {
  beforeEach(async () => {
    document.body.innerHTML = ''
    resetStore()
    if (!i18next.isInitialized) {
      await i18next.use(initReactI18next).init({ lng: 'en-US', resources: {} })
    } else {
      await i18next.changeLanguage('en-US')
      i18next.services.resourceStore.data = {}
    }
  })

  it('renders the current passage', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: 'Hello **world**' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText(/Hello/)
    expect(text).toBeInTheDocument()
  })

  it('renders nothing when no passage is set', () => {
    render(<Passage />)
    expect(document.body.textContent).toBe('')
  })

  it('navigates to the linked passage when a button is clicked', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: 'Go to [[Next]]' }]
    }
    const next: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Next' },
      children: []
    }

    useStoryDataStore.setState({
      passages: [start, next],
      currentPassageId: '1'
    })

    render(<Passage />)

    const button = await screen.findByRole('button', { name: 'Next' })
    button.click()
    expect(useStoryDataStore.getState().currentPassageId).toBe('Next')
  })

  it('navigates to a passage by name with goto directive', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':goto[Second]' }]
    }
    const second: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Second' },
      children: [{ type: 'text', value: 'Second text' }]
    }

    useStoryDataStore.setState({
      passages: [start, second],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      expect(screen.getByText('Second text')).toBeInTheDocument()
      expect(useStoryDataStore.getState().currentPassageId).toBe('Second')
    })
  })

  it('navigates to a passage by pid with goto directive', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':goto[2]' }]
    }
    const second: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Second' },
      children: [{ type: 'text', value: 'Second text' }]
    }

    useStoryDataStore.setState({
      passages: [start, second],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      expect(screen.getByText('Second text')).toBeInTheDocument()
      expect(useStoryDataStore.getState().currentPassageId).toBe('2')
    })
  })

  it('renders included passage content', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':include[Second]' }]
    }
    const second: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Second' },
      children: [{ type: 'text', value: 'Inner text' }]
    }

    useStoryDataStore.setState({
      passages: [start, second],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText('Inner text')
    expect(text).toBeInTheDocument()
  })

  it('evaluates directives within included passages', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':include[Second]' }]
    }
    const second: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Second' },
      children: [{ type: 'text', value: ':set{visited=true}' }]
    }

    useStoryDataStore.setState({
      passages: [start, second],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() =>
      expect(
        (useGameStore.getState().gameData as Record<string, unknown>).visited
      ).toBe('true')
    )
  })

  it('executes once blocks only once', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':::once{intro}\nHello\n:::' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    const { rerender } = render(<Passage />)

    const text = await screen.findByText('Hello')
    expect(text).toBeInTheDocument()

    act(() => {
      useStoryDataStore.setState({ currentPassageId: undefined })
    })
    rerender(<Passage />)

    act(() => {
      useStoryDataStore.setState({ currentPassageId: '1' })
    })
    rerender(<Passage />)
    await waitFor(() => {
      expect(screen.queryByText('Hello')).toBeNull()
    })
  })

  it('skips once blocks inside false if directives', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':::if{false}\n:::once{intro}\nHello\n:::\n:::'
        }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      expect(screen.queryByText('Hello')).toBeNull()
      expect(useGameStore.getState().onceKeys.intro).toBeUndefined()
    })
  })

  it('executes the set directive', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':set[number]{hp=5}' }]
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
      children: [{ type: 'text', value: ':set[number]{hp=5}\n\nHello' }]
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

  it('locks keys with setOnce', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':setOnce[number]{gold=10}' }]
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

  it('retrieves values with get directive', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { score: 7 }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: 'Score: :get{score}' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText('Score: 7')
    expect(text).toBeInTheDocument()
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

  it('slices arrays with get directive', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { items: ['a', 'b', 'c'] }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: 'Slice: :get[items.slice(1)]' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      expect(screen.getByText('Slice: b,c')).toBeInTheDocument()
      expect(useGameStore.getState().gameData.items).toEqual(['a', 'b', 'c'])
    })
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

  it('concats arrays with get directive', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { items: ['a', 'b', 'c'] }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: "Concat: :get[items.concat(['d','e'])]"
        }
      ]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      expect(screen.getByText('Concat: a,b,c,d,e')).toBeInTheDocument()
      expect(useGameStore.getState().gameData.items).toEqual(['a', 'b', 'c'])
    })
  })

  it('joins arrays with get directive', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { items: ['a', 'b', 'c'] }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: "Joined: :get[items.join('-')]"
        }
      ]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      expect(screen.getByText('Joined: a-b-c')).toBeInTheDocument()
      expect(useGameStore.getState().gameData.items).toEqual(['a', 'b', 'c'])
    })
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

  it('evaluates expressions with math directive', async () => {
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

    const text = await screen.findByText('Result: 6')
    expect(text).toBeInTheDocument()
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
      children: [{ type: 'text', value: 'HP: :math[hp + 1]{key=hp}' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText('HP: 6')
    expect(text).toBeInTheDocument()
    expect(useGameStore.getState().gameData.hp).toBe(6)
  })

  it('increments values', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { count: 1 }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':increment{key=count amount=2}' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() =>
      expect(
        (useGameStore.getState().gameData as Record<string, unknown>).count
      ).toBe(3)
    )
  })

  it('decrements values', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { count: 3 }
    }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':decrement{key=count amount=1}' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() =>
      expect(
        (useGameStore.getState().gameData as Record<string, unknown>).count
      ).toBe(2)
    )
  })

  it('creates range values with set[range]', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        { type: 'text', value: ':set[range]{key=hp min=0 max=10 value=5}' }
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

  it('chooses the correct branch with the if directive', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':::if{true}\nShown\n:::else\nHidden\n:::'
        }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText('Shown')
    expect(text).toBeInTheDocument()
    expect(document.body.textContent).not.toContain('Hidden')
  })

  it('changes locale with lang directive', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':lang{locale=fr-FR}' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      expect(i18next.language).toBe('fr-FR')
    })
  })

  it('retrieves translations with t directive', async () => {
    i18next.addResource('en-US', 'translation', 'hello', 'Hello')
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':t{key=hello}' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText('Hello')
    expect(text).toBeInTheDocument()
  })

  it('handles pluralization with t directive', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':translations{apple_one="1 apple" apple_other="{{count}} apples"}'
        },
        { type: 'text', value: ':t{key=apple count=2}' }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText('2 apples')
    expect(text).toBeInTheDocument()
  })

  it('resolves translations inside links', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        { type: 'text', value: ':translations{next="Next"}' },
        { type: 'text', value: '[[:t{key=next}->Next]]' }
      ]
    }
    const next: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Next' },
      children: []
    }

    useStoryDataStore.setState({
      passages: [start, next],
      currentPassageId: '1'
    })

    render(<Passage />)

    const button = await screen.findByRole('button', { name: 'Next' })
    button.click()
    expect(useStoryDataStore.getState().currentPassageId).toBe('Next')
  })

  it('creates namespaces from translations directive', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        { type: 'text', value: ':translations{ns=ui goodbye="Au revoir"}' },
        { type: 'text', value: ':t{key=goodbye ns=ui}' }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText('Au revoir')
    expect(text).toBeInTheDocument()
    expect(i18next.hasResourceBundle('en-US', 'ui')).toBe(true)
  })

  it('runs onEnter and onExit blocks at the appropriate times', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::onEnter\n:set{entered=true}\n:::\n:::onExit\n:set{exited=true}\n:::\n[[Next]]'
        }
      ]
    }
    const next: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Next' },
      children: []
    }

    useStoryDataStore.setState({
      passages: [start, next],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      expect(useGameStore.getState().gameData.entered).toBe('true')
    })

    const button = await screen.findByRole('button', { name: 'Next' })
    act(() => {
      button.click()
    })

    await waitFor(() => {
      expect(useGameStore.getState().gameData.exited).toBe('true')
    })
  })

  it('runs onChange blocks when a key updates and cleans up on exit', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':::onChange{key=hp}\n:set{changed=true}\n:::\n'
        }
      ]
    }
    const next: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Next' },
      children: []
    }

    useGameStore.setState({
      gameData: { hp: 1 },
      _initialGameData: { hp: 1 },
      lockedKeys: {},
      onceKeys: {}
    })
    useStoryDataStore.setState({
      passages: [start, next],
      currentPassageId: '1'
    })

    render(<Passage />)

    act(() => {
      useGameStore.getState().setGameData({ hp: 2 })
    })

    await waitFor(() => {
      expect(useGameStore.getState().gameData.changed).toBe('true')
    })

    act(() => {
      useGameStore.getState().unsetGameData('changed')
      useStoryDataStore.getState().setCurrentPassage('2')
    })

    act(() => {
      useGameStore.getState().setGameData({ hp: 3 })
    })

    expect(useGameStore.getState().gameData.changed).toBeUndefined()
  })

  it('saves and restores game state with checkpoints', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        { type: 'text', value: ':set[number]{hp=5}:checkpoint{id=cp1}' }
      ]
    }
    const second: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Second' },
      children: [{ type: 'text', value: ':set[number]{hp=1}:restore{id=cp1}' }]
    }

    useStoryDataStore.setState({
      passages: [start, second],
      currentPassageId: '1'
    })

    const { rerender } = render(<Passage />)
    await waitFor(() =>
      expect((useGameStore.getState().gameData as any).hp).toBe(5)
    )

    act(() => {
      useStoryDataStore.setState({ currentPassageId: '2' })
    })
    rerender(<Passage />)

    await waitFor(() => {
      expect((useGameStore.getState().gameData as any).hp).toBe(5)
      expect(useStoryDataStore.getState().currentPassageId).toBe('1')
    })
  })

  it('uses translated text as checkpoint label', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        { type: 'text', value: ':translations{save="Save"}' },
        { type: 'text', value: ':checkpoint{id=cp1 label=save}' }
      ]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      const cp = useGameStore.getState().checkpoints.cp1
      expect(cp?.label).toBe('Save')
    })
  })

  it('ignores checkpoint and restore directives in included passages', async () => {
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':set[number]{hp=2}:checkpoint{id=cp1}:include[Second]'
        }
      ]
    }
    const second: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Second' },
      children: [
        {
          type: 'text',
          value: ':set[number]{hp=1}:restore{id=cp1}:checkpoint{id=cp2}'
        }
      ]
    }

    useStoryDataStore.setState({
      passages: [start, second],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      expect((useGameStore.getState().gameData as any).hp).toBe(1)
      expect(useGameStore.getState().checkpoints.cp2).toBeUndefined()
      expect(useGameStore.getState().checkpoints.cp1).toBeDefined()
    })
  })

  it('stores error and creates no checkpoint when multiple checkpoints are in one passage', async () => {
    const logged: unknown[] = []
    const orig = console.error
    console.error = (...args: unknown[]) => {
      logged.push(args)
    }

    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':checkpoint{id=cp1}:set[number]{hp=1}:checkpoint{id=cp2}'
        }
      ]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      expect(Object.keys(useGameStore.getState().checkpoints)).toHaveLength(0)
      expect(logged).toHaveLength(1)
      expect(useGameStore.getState().errors).toEqual([
        'Multiple checkpoints in a single passage are not allowed'
      ])
    })

    console.error = orig
  })

  it('saves game state and checkpoints to local storage', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':set[number]{hp=5}:checkpoint{id=cp1}:save{key=slot1}'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    await waitFor(() => {
      const raw = localStorage.getItem('slot1')
      expect(raw).toBeTruthy()
      const data = JSON.parse(raw || '{}')
      expect(data.gameData.hp).toBe(5)
      expect(data.currentPassageId).toBe('1')
      expect(data.checkpoints.cp1).toBeDefined()
    })
    expect(useGameStore.getState().loading).toBe(false)
  })

  it('loads game state and checkpoints from local storage', async () => {
    localStorage.setItem(
      'slot1',
      JSON.stringify({
        gameData: { hp: 7 },
        lockedKeys: {},
        onceKeys: {},
        checkpoints: {
          cp1: {
            gameData: { hp: 7 },
            lockedKeys: {},
            onceKeys: {},
            currentPassageId: '2',
            timestamp: 1
          }
        },
        currentPassageId: '2'
      })
    )
    const start: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':load{key=slot1}' }]
    }
    const second: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '2', name: 'Second' },
      children: [{ type: 'text', value: 'Second text' }]
    }

    useStoryDataStore.setState({
      passages: [start, second],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      expect((useGameStore.getState().gameData as any).hp).toBe(7)
      expect(useGameStore.getState().checkpoints.cp1).toBeDefined()
      expect(
        (useGameStore.getState().checkpoints.cp1?.gameData as any).hp
      ).toBe(7)
      expect(useStoryDataStore.getState().currentPassageId).toBe('2')
      expect(screen.getByText('Second text')).toBeInTheDocument()
    })
    expect(useGameStore.getState().loading).toBe(false)
  })

  it('logs error when loaded state lacks current passage id', async () => {
    const logged: unknown[] = []
    const orig = console.error
    console.error = (...args: unknown[]) => {
      logged.push(args)
    }

    localStorage.setItem('slot1', JSON.stringify({ gameData: { hp: 7 } }))
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':load{key=slot1}' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      expect((useGameStore.getState().gameData as any).hp).toBe(7)
      expect(useStoryDataStore.getState().currentPassageId).toBe('1')
      expect(logged).toHaveLength(1)
      expect(useGameStore.getState().errors).toEqual([
        'Saved game state has no current passage'
      ])
    })

    console.error = orig
  })

  it('clears a checkpoint by id', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':checkpoint{id=cp1}:clearCheckpoint{id=cp1}'
        }
      ]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      expect(useGameStore.getState().checkpoints).toEqual({})
    })
  })

  it('clears all checkpoints when no id is provided', async () => {
    const state = useGameStore.getState()
    state.saveCheckpoint('cp1', {
      gameData: {},
      lockedKeys: {},
      onceKeys: {},
      currentPassageId: '1'
    })
    state.saveCheckpoint('cp2', {
      gameData: {},
      lockedKeys: {},
      onceKeys: {},
      currentPassageId: '1'
    })

    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':clearCheckpoint' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      expect(useGameStore.getState().checkpoints).toEqual({})
    })
  })

  it('clears saved data from local storage', async () => {
    localStorage.setItem('slot1', 'test')

    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':clearSave{key=slot1}' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      expect(localStorage.getItem('slot1')).toBeNull()
    })
    expect(useGameStore.getState().loading).toBe(false)
  })

  it('stores error when restore cannot find a checkpoint', async () => {
    const logged: unknown[] = []
    const orig = console.error
    console.error = (...args: unknown[]) => {
      logged.push(args)
    }

    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':restore{id=missing}' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })

    render(<Passage />)

    await waitFor(() => {
      expect(logged).toHaveLength(1)
      expect(useGameStore.getState().errors).toEqual([
        'Checkpoint not found: missing'
      ])
    })

    console.error = orig
  })

  it('clears errors via directive', async () => {
    useGameStore.setState({ errors: ['oops'] })
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':clearErrors' }]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    await waitFor(() => {
      expect(useGameStore.getState().errors).toEqual([])
    })
  })
})
