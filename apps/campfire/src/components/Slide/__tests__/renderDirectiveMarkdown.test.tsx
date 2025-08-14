import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import { renderDirectiveMarkdown } from '@campfire/components/Slide/renderDirectiveMarkdown'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { useGameStore } from '@campfire/state/useGameStore'
import { resetStores } from '@campfire/test-utils/helpers'
import type { ComponentChild } from 'preact'

/**
 * Component wrapper that renders directive markdown using project handlers.
 */
const MarkdownWrapper = ({
  markdown
}: {
  markdown: string
}): ComponentChild => {
  const handlers = useDirectiveHandlers()
  return <>{renderDirectiveMarkdown(markdown, handlers)}</>
}

beforeEach(() => {
  resetStores()
  document.body.innerHTML = ''
})

describe('renderDirectiveMarkdown', () => {
  it('runs directive handlers while rendering markdown', () => {
    render(<MarkdownWrapper markdown=':set[flag=true]' />)
    const data = useGameStore.getState().gameData as Record<string, unknown>
    expect(data.flag).toBe(true)
  })
})
