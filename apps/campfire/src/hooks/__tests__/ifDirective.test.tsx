import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { render, fireEvent, waitFor } from '@testing-library/preact'
import { Fragment } from 'preact/jsx-runtime'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { renderDirectiveMarkdown } from '@campfire/components/Deck/Slide'
import { useGameStore } from '@campfire/state/useGameStore'

/**
 * Blocks outbound network requests triggered by happy-dom during tests.
 *
 * @param _input - Ignored request input.
 * @param _init - Ignored request options.
 * @returns A resolved response with no content.
 */
const resolveEmptyFetch: typeof globalThis.fetch = async (
  _input: RequestInfo | URL,
  _init?: RequestInit
) => new Response('', { status: 204 })

let originalFetch: typeof globalThis.fetch = globalThis.fetch

/**
 * Component used in tests to render markdown with directive handlers.
 *
 * @param markdown - Markdown string that may include directive containers.
 * @returns Nothing; renders directive output.
 */
const MarkdownRunner = ({ markdown }: { markdown: string }) => {
  const handlers = useDirectiveHandlers()
  const rendered = renderDirectiveMarkdown(markdown, handlers)
  return <Fragment>{rendered}</Fragment>
}

beforeEach(() => {
  document.body.innerHTML = ''
  const store = useGameStore.getState()
  store.reset()
  originalFetch = globalThis.fetch
  globalThis.fetch = resolveEmptyFetch
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('if directive', () => {
  it('removes trailing directive markers after processing', () => {
    const md = [
      'Hello adventurer! Enter your name:',
      '::input[playerName]{placeholder="Your name"}',
      '',
      ':::if[true]',
      '  Ready to continue?',
      ':::'
    ].join('\n')

    render(<MarkdownRunner markdown={md} />)

    expect(document.querySelector('input')).toBeTruthy()
    expect(document.body.innerHTML).not.toContain(':::')
  })

  it('strips marker paragraphs when conditionals follow leaf directives', () => {
    const md = [
      'Hello adventurer! Enter your name:',
      '::input[playerName]{placeholder="Your name"}',
      '',
      ':::if[(playerName && playerName.trim())]',
      '  :::trigger{label="Continue"}',
      '    ::goto["ChooseClass"]',
      '  :::',
      ':::'
    ].join('\n')

    render(<MarkdownRunner markdown={md} />)

    expect(document.body.innerHTML).not.toContain(':::')
  })

  it('does not execute state directives when the condition is false', () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { ready: true }
    }))

    const md = [
      ':::if[(!ready)]',
      '  ::setOnce[hpInitialized=true]',
      '  ::createRange[hp=10]{min=0 max=10}',
      ':::'
    ].join('\n')

    render(<MarkdownRunner markdown={md} />)

    const data = useGameStore.getState().gameData as Record<string, unknown>
    expect(data.hpInitialized).toBeUndefined()
    expect(data.hp).toBeUndefined()
  })

  it('preserves trigger state directives inside conditional content', async () => {
    useGameStore.setState(state => ({
      ...state,
      gameData: { ready: false }
    }))

    const md = [
      ':::if[(!ready)]',
      '  :::trigger{label="Initialize"}',
      '    ::set[ready=true]',
      '  :::',
      ':::'
    ].join('\n')

    const { getByRole } = render(<MarkdownRunner markdown={md} />)

    fireEvent.click(getByRole('button', { name: 'Initialize' }))

    await waitFor(() => {
      expect(useGameStore.getState().gameData.ready).toBe(true)
    })
  })
})
