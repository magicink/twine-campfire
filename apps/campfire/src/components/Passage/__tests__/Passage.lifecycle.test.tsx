import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, waitFor, act } from '@testing-library/preact'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { OnExit } from '@campfire/components/Passage/OnExit'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { useGameStore } from '@campfire/state/useGameStore'
import { resetStores } from '@campfire/test-utils/helpers'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import type { Root } from 'mdast'

describe('Passage lifecycle directives', () => {
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

  it('handles empty once blocks without skipping following directives', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':::once{intro}\n:::\n:::if{true}\nAfter\n:::'
        }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    const text = await screen.findByText('After')
    expect(text).toBeInTheDocument()
  })

  it('renders onExit blocks as components without displaying content', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: 'Visible\n:::onExit\n:set[x=1]\n:::' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    const visible = await screen.findByText('Visible')
    expect(visible).toBeInTheDocument()
    expect(screen.queryByText('set[x=1]')).toBeNull()
  })

  it('runs onExit directives when the component unmounts', async () => {
    const root = unified()
      .use(remarkParse)
      .use(remarkDirective)
      .parse(':set[hp=5]') as Root
    const content = JSON.stringify(root.children)
    const { unmount } = render(<OnExit content={content} />)
    act(() => {
      unmount()
    })
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).hp
    ).toBe(5)
  })

  it('processes if directives inside onExit blocks', async () => {
    const root = unified()
      .use(remarkParse)
      .use(remarkDirective)
      .parse(':::if[false]\n:set[a=1]\n:::else\n:set[b=2]\n:::') as Root
    const content = JSON.stringify(root.children)
    const { unmount } = render(<OnExit content={content} />)
    act(() => {
      unmount()
    })
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    const data = useGameStore.getState().gameData as Record<string, unknown>
    expect(data.a).toBeUndefined()
    expect(data.b).toBe(2)
    expect(useGameStore.getState().errors).toEqual([])
  })

  it('runs batch directives inside onExit blocks', async () => {
    useGameStore.getState().setGameData({ old: true })
    const root = unified()
      .use(remarkParse)
      .use(remarkDirective)
      .parse(':::batch\n:set[a=1]\n:unset{key=old}\n:::') as Root
    const content = JSON.stringify(root.children)
    const { unmount } = render(<OnExit content={content} />)
    act(() => {
      unmount()
    })
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    const data = useGameStore.getState().gameData as Record<string, unknown>
    expect(data.a).toBe(1)
    expect('old' in data).toBe(false)
    expect(useGameStore.getState().errors).toEqual([])
  })

  it('handles random directives inside onExit blocks', async () => {
    const root = unified()
      .use(remarkParse)
      .use(remarkDirective)
      .parse(':random[roll]{min=1 max=6}') as Root
    const content = JSON.stringify(root.children)
    const { unmount } = render(<OnExit content={content} />)
    act(() => {
      unmount()
    })
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    const data = useGameStore.getState().gameData as Record<string, unknown>
    expect(data.roll).toBeGreaterThanOrEqual(1)
    expect(data.roll).toBeLessThanOrEqual(6)
  })

  it('handles array-based random directives inside batch within onExit blocks', async () => {
    const root = unified()
      .use(remarkParse)
      .use(remarkDirective)
      .parse(":::batch\n:random[item]{from=['a','b','c']}\n:::") as Root
    const content = JSON.stringify(root.children)
    const { unmount } = render(<OnExit content={content} />)
    act(() => {
      unmount()
    })
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    const data = useGameStore.getState().gameData as Record<string, unknown>
    expect(['a', 'b', 'c']).toContain(data.item)
  })

  it('locks keys with randomOnce inside onExit blocks', async () => {
    const root = unified()
      .use(remarkParse)
      .use(remarkDirective)
      .parse(':randomOnce[foo]{min=1 max=2}') as Root
    const content = JSON.stringify(root.children)
    const { unmount } = render(<OnExit content={content} />)
    act(() => {
      unmount()
    })
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    const { gameData, lockedKeys } = useGameStore.getState()
    const value = (gameData as Record<string, unknown>).foo as number
    expect([1, 2]).toContain(value)
    expect(lockedKeys.foo).toBe(true)
    useGameStore.getState().setGameData({ foo: 99 })
    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).foo
    ).toBe(value)
  })

  it('does not render stray colons when batch is inside onExit', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: 'Visible\n:::onExit\n:::batch\n:set[a=1]\n:::\n:::\n'
        }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)
    await screen.findByText('Visible')
    expect(screen.queryByText(':::')).toBeNull()
  })

  it('executes onExit directives only once on unmount', async () => {
    const root = unified()
      .use(remarkParse)
      .use(remarkDirective)
      .parse(':set[count=(count||0)+1]') as Root
    const content = JSON.stringify(root.children)
    const { unmount } = render(<OnExit content={content} />)
    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).count
    ).toBeUndefined()
    act(() => {
      unmount()
    })
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    expect(
      (useGameStore.getState().gameData as Record<string, unknown>).count
    ).toBe(1)
  })

  it('stores error and removes additional onExit directives in one passage', async () => {
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
          value: ':::onExit\n:set[a=1]\n:::\n:::onExit\n:set[b=2]\n:::'
        }
      ]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      expect(useGameStore.getState().errors).toEqual([
        'Multiple onExit directives in a single passage are not allowed'
      ])
      expect(logged).toHaveLength(1)
    })

    console.error = orig
  })

  it('logs error for non-data directives in onExit blocks', async () => {
    const logged: unknown[] = []
    const orig = console.error
    console.error = (...args: unknown[]) => {
      logged.push(args)
    }

    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':::onExit\n:goto[Two]\n:::' }]
    }

    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })

    render(<Passage />)

    await waitFor(() => {
      expect(useGameStore.getState().errors).toEqual([
        'onExit only supports directives: set, setOnce, array, arrayOnce, createRange, setRange, unset, random, randomOnce, if, batch'
      ])
      expect(logged).toHaveLength(1)
    })

    console.error = orig
  })
})
