import { describe, it, expect, beforeEach } from 'bun:test'
import { render, act } from '@testing-library/preact'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import type { RootContent } from 'mdast'
import { useDirectiveEvents } from '@campfire/hooks/useDirectiveEvents'
import { useGameStore } from '@campfire/state/useGameStore'
import { resetStores } from '@campfire/test-utils/helpers'

/**
 * Serializes a directive markdown snippet into a JSON string.
 *
 * @param md - Markdown containing directives.
 * @returns Serialized directive nodes.
 */
const serialize = (md: string) =>
  JSON.stringify(
    unified().use(remarkParse).use(remarkGfm).use(remarkDirective).parse(md)
      .children as RootContent[]
  )

describe('useDirectiveEvents', () => {
  beforeEach(() => {
    resetStores()
  })

  it('executes directives when event handlers fire', () => {
    const content = serialize('::push{key=items value=1}')

    /** Test component wiring directive events. */
    const TestComponent = () => {
      const { onMouseEnter } = useDirectiveEvents(content)
      return <div data-testid='target' onMouseEnter={onMouseEnter} />
    }

    render(<TestComponent />)
    const el = document.querySelector('[data-testid="target"]') as HTMLElement

    act(() => {
      el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    })

    expect((useGameStore.getState().gameData.items as unknown[]).length).toBe(2)
  })

  it('returns undefined handlers when content is missing', () => {
    /** Component without directive content. */
    const TestComponent = () => {
      const { onMouseEnter } = useDirectiveEvents()
      return <div data-testid='target' onMouseEnter={onMouseEnter} />
    }

    const { container } = render(<TestComponent />)
    const el = container.firstElementChild as HTMLDivElement
    expect(el.onmouseenter).toBeNull()
  })
})
