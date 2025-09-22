import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import { Fragment } from 'preact/jsx-runtime'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { renderDirectiveMarkdown } from '@campfire/components/Deck/Slide'

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
})
