import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import type { ComponentChild } from 'preact'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { renderDirectiveMarkdown } from '@campfire/components/Deck/Slide'

let output: ComponentChild | null = null

/**
 * Helper component to render markdown with directive handlers.
 */
const MarkdownRunner = ({ markdown }: { markdown: string }) => {
  const handlers = useDirectiveHandlers()
  output = renderDirectiveMarkdown(markdown, handlers)
  return <>{output}</>
}

beforeEach(() => {
  output = null
  document.body.innerHTML = ''
})

describe('deep nested containers', () => {
  it('renders nested containers with sibling containers correctly', () => {
    const md =
      ':set[show=true]\n' +
      ':::layer{className="flex"}\n' +
      ':::wrapper{as="div"}\n' +
      ':::wrapper{as="div"}\n' +
      ':radio[choice]{value="a"}\n' +
      ':::\n' +
      ':::wrapper{as="div"}\n' +
      ':radio[choice]{value="b"}\n' +
      ':::if[show]\n' +
      'hi\n' +
      ':::\n' +
      ':::\n' +
      ':::\n' +
      ':::wrapper{as="div"}\n' +
      ':radio[choice]{value="c"}\n' +
      ':::\n' +
      ':::\n'
    render(<MarkdownRunner markdown={md} />)
    const layer = document.querySelector('[data-testid="layer"]') as HTMLElement
    const wrappers = layer.querySelectorAll('[data-testid="wrapper"]')
    expect(wrappers.length).toBe(4)
    const radios = layer.querySelectorAll('[data-testid="radio"]')
    expect(radios.length).toBe(3)
    expect(document.body.innerHTML).not.toContain(':::')
  })
})
