import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, act, waitFor } from '@testing-library/preact'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import type { RootContent } from 'mdast'
import { If } from '@campfire/components/Passage/If'
import { useGameStore } from '@campfire/state/useGameStore'

/**
 * Serializes plain text into a JSON string representing markdown nodes.
 */
const makeContent = (text: string) =>
  JSON.stringify([
    { type: 'paragraph', children: [{ type: 'text', value: text }] }
  ])

/**
 * Parses markdown with directives into a serialized node array.
 */
const makeMixedContent = (md: string) =>
  JSON.stringify(
    unified().use(remarkParse).use(remarkGfm).use(remarkDirective).parse(md)
      .children as RootContent[]
  )

describe('If', () => {
  beforeEach(() => {
    useGameStore.setState({
      gameData: {},
      _initialGameData: {},
      lockedKeys: {},
      onceKeys: {},
      checkpoints: {},
      errors: [],
      loading: false
    })
  })
  it('renders content when condition is true', () => {
    render(<If test='true' content={makeContent('Hello')} />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('renders fallback when condition is false', () => {
    render(
      <If
        test='false'
        content={makeContent('Content')}
        fallback={makeContent('Fallback')}
      />
    )
    expect(screen.getByText('Fallback')).toBeInTheDocument()
  })

  it('renders nothing when condition is false and no fallback', () => {
    const { container } = render(
      <If test='false' content={makeContent('Nope')} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('uses game data in expressions', () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { some_key: true }
    }))
    render(<If test='some_key' content={makeContent('Yes')} />)
    expect(screen.getByText('Yes')).toBeInTheDocument()
  })

  it('supports negation', () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { some_key: false }
    }))
    render(<If test='!some_key' content={makeContent('Yes')} />)
    expect(screen.getByText('Yes')).toBeInTheDocument()
  })

  it('supports double negation', () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { some_key: 'value' }
    }))
    render(<If test='!!some_key' content={makeContent('Yes')} />)
    expect(screen.getByText('Yes')).toBeInTheDocument()
  })

  it('compares values', () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { key_a: 1, key_b: 2 }
    }))
    render(<If test='key_a < key_b' content={makeContent('Yes')} />)
    expect(screen.getByText('Yes')).toBeInTheDocument()
  })

  it('checks types', () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { key_a: 1 }
    }))
    render(<If test='typeof key_a !== "string"' content={makeContent('Yes')} />)
    expect(screen.getByText('Yes')).toBeInTheDocument()
  })

  it('supports standard markdown formatting', () => {
    const content = makeMixedContent('**bold** ~~strike~~')
    render(<If test='true' content={content} />)
    expect(screen.getByText('bold').tagName).toBe('STRONG')
    expect(screen.getByText('strike').tagName).toBe('DEL')
  })

  it('mixes content and directives', () => {
    const content = makeMixedContent('Start\n::set[hp=2]\nHP!')
    render(<If test='true' content={content} />)
    expect(screen.getByText('Start')).toBeInTheDocument()
    expect(screen.getByText('HP!')).toBeInTheDocument()
    expect(useGameStore.getState().gameData.hp).toBe(2)
  })

  it('executes trigger directives', async () => {
    const content = makeMixedContent(
      ':::trigger{label="Fire"}\n::set[fired=true]\n:::\n'
    )
    render(<If test='true' content={content} />)
    const button = await screen.findByRole('button', { name: 'Fire' })
    act(() => {
      button.click()
    })
    await waitFor(() => {
      expect(useGameStore.getState().gameData.fired).toBe(true)
    })
  })

  it('renders multiple container directives', () => {
    const content = makeMixedContent(
      ':::trigger{label="One"}\n:::\n:::trigger{label="Two"}\n:::\n:::'
    )
    render(<If test='true' content={content} />)
    expect(screen.getByRole('button', { name: 'One' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Two' })).toBeInTheDocument()
  })
})
