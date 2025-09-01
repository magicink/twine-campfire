import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, act, waitFor } from '@testing-library/preact'
import type { ComponentChild } from 'preact'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { renderDirectiveMarkdown } from '@campfire/components/Deck/Slide'
import { useGameStore } from '@campfire/state/useGameStore'
import { resetStores } from '@campfire/test-utils/helpers'

/**
 * Renders directive markdown using project handlers.
 *
 * @param markdown - Markdown string containing directives.
 * @returns The rendered component tree.
 */
const MarkdownRunner = ({ markdown }: { markdown: string }): ComponentChild => {
  const handlers = useDirectiveHandlers()
  return <>{renderDirectiveMarkdown(markdown, handlers)}</>
}

beforeEach(() => {
  resetStores()
  document.body.innerHTML = ''
  ;(HTMLElement.prototype as any).animate = () => ({
    finished: Promise.resolve()
  })
})

describe('nested if/set directives', () => {
  it('processes deeply nested directives with siblings', async () => {
    const md = `:::deck\n:::slide\nbefore slide\n:::layer\nbefore trigger\n:::trigger{label="fire"}\nbefore set\n:::set[flag=true]\n:::\n\nbetween\n:::if[flag]\nhit\n:::\n\nafter if\n\n:::\n\nafter trigger\n\n:::\n\nafter layer\n:::layer\nsecond layer\n:::\nend slide\n:::\n:::slide\nsecond slide\n:::\n:::`
    render(<MarkdownRunner markdown={md} />)

    expect(screen.queryByText('hit')).toBeNull()
    const button = await screen.findByRole('button', { name: 'fire' })
    act(() => {
      button.click()
    })

    await waitFor(() => {
      expect(useGameStore.getState().gameData.flag).toBe(true)
    })
    await screen.findByText('hit')

    expect(screen.getByText('before slide')).toBeInTheDocument()
    expect(screen.getByText('after trigger')).toBeInTheDocument()
    expect(screen.getByText('after layer')).toBeInTheDocument()
    expect(screen.getByText('second layer')).toBeInTheDocument()
    expect(document.body.textContent).not.toContain(':::')
  })
})
