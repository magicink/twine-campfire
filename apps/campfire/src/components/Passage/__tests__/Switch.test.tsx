import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen } from '@testing-library/preact'
import { Switch } from '@campfire/components/Passage/Switch'
import { useGameStore } from '@campfire/state/useGameStore'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import type { RootContent } from 'mdast'

const makeContent = (text: string) =>
  JSON.stringify([
    { type: 'paragraph', children: [{ type: 'text', value: text }] }
  ])

const makeMixedContent = (md: string) =>
  JSON.stringify(
    unified().use(remarkParse).use(remarkGfm).use(remarkDirective).parse(md)
      .children as RootContent[]
  )

describe('Switch', () => {
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

  it('renders matching case', () => {
    const cases = JSON.stringify([
      { test: '1', content: makeContent('One') },
      { test: '2', content: makeContent('Two') }
    ])
    render(<Switch test='2' cases={cases} />)
    expect(screen.getByText('Two')).toBeInTheDocument()
  })

  it('renders default when no case matches', () => {
    const cases = JSON.stringify([{ test: '1', content: makeContent('One') }])
    render(<Switch test='2' cases={cases} fallback={makeContent('Fallback')} />)
    expect(screen.getByText('Fallback')).toBeInTheDocument()
  })

  it('renders nothing when no match and no default', () => {
    const cases = JSON.stringify([{ test: '1', content: makeContent('One') }])
    const { container } = render(<Switch test='2' cases={cases} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('executes nested directives in case content', () => {
    const cases = JSON.stringify([
      {
        test: 'true',
        content: makeMixedContent('::set[hp=2]')
      }
    ])
    render(<Switch test='true' cases={cases} />)
    expect(useGameStore.getState().gameData.hp).toBe(2)
  })
})
