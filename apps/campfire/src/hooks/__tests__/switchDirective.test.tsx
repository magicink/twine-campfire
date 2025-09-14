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

describe('switch directive', () => {
  it('renders matching case', () => {
    const md = [
      ':::switch["red"]',
      ':::case["red"]',
      'Red',
      ':::',
      ':::case["blue"]',
      'Blue',
      ':::',
      ':::default',
      'No match',
      ':::',
      ':::'
    ].join('\n')
    render(<MarkdownRunner markdown={md} />)
    expect(document.body.textContent?.replace(/\n/g, '')).toBe('Red')
  })

  it('renders default when no case matches', () => {
    const md = [
      ':::switch["green"]',
      ':::case["red"]',
      'Red',
      ':::',
      ':::case["blue"]',
      'Blue',
      ':::',
      ':::default',
      'No match',
      ':::',
      ':::'
    ].join('\n')
    render(<MarkdownRunner markdown={md} />)
    expect(document.body.textContent?.replace(/\n/g, '')).toBe('No match')
  })
})
