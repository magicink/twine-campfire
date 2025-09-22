import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import { Fragment } from 'preact/jsx-runtime'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { renderDirectiveMarkdown } from '@campfire/components/Deck/Slide'

/**
 * Component used in tests to render markdown with directive handlers.
 *
 * @param markdown - Markdown string that may include directive containers.
 * @returns Nothing; sets `output` with rendered content.
 */
const MarkdownRunner = ({ markdown }: { markdown: string }) => {
  const handlers = useDirectiveHandlers()
  const rendered = renderDirectiveMarkdown(markdown, handlers)
  return <Fragment>{rendered}</Fragment>
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('for directive', () => {
  it('iterates over array items', () => {
    const md = ':::for[x in [1,2,3]]\nHi\n:::'
    render(<MarkdownRunner markdown={md} />)
    expect(document.body.textContent?.replace(/\n/g, '')).toBe('HiHiHi')
  })

  it('iterates over range values', () => {
    const md = '::createRange[r=1]{min=1 max=3}\n:::for[x in r]\nHi\n:::'
    render(<MarkdownRunner markdown={md} />)
    expect(document.body.textContent?.replace(/\n/g, '')).toBe('HiHiHi')
  })

  it('renders nothing for empty iterables', () => {
    const md = ':::for[x in []]\nHi\n:::'
    render(<MarkdownRunner markdown={md} />)
    expect(document.body.textContent?.replace(/\n/g, '')).toBe('')
  })

  it('processes nested directives inside for', () => {
    const md = ':::for[x in [1,2]]\n:::if[true]\nHi\n:::\n:::'
    render(<MarkdownRunner markdown={md} />)
    expect(document.body.textContent?.replace(/\n/g, '')).toBe('HiHi')
  })

  it('expands show directives using loop variables', () => {
    const md = ':::for[x in [1,2,3]]\nValue :show[x]\n:::'
    render(<MarkdownRunner markdown={md} />)
    expect(document.body.textContent?.replace(/\n/g, '')).toBe(
      'Value 1Value 2Value 3'
    )
  })

  it('preserves show attributes within loops', () => {
    const md =
      ':::for[x in [1,2,3]]\n' +
      'Value :show[x]{as="span" className="stat"}\n' +
      ':::'
    render(<MarkdownRunner markdown={md} />)
    const spans = document.querySelectorAll('span.campfire-show.stat')
    expect(spans).toHaveLength(3)
    expect(spans[0].textContent).toBe('1')
  })

  it('evaluates nested if blocks using loop variables', () => {
    const md =
      '::array[fruits=["apple","banana","cherry"]]\n' +
      ':::for[fruit in fruits]\n' +
      ':::if[fruit !== "banana"]\n' +
      ':show[fruit]\n' +
      ':::\n' +
      ':::'
    render(<MarkdownRunner markdown={md} />)
    expect(document.body.textContent?.replace(/\n/g, '')).toBe('applecherry')
  })

  it('skips list items when loop conditions fail', () => {
    const md = [
      '::array[fruits=["apple","banana","cherry"]]',
      ':::for[fruit in fruits]',
      '',
      ':::if[fruit !== "banana"]',
      '',
      '- :show[fruit]{className="text-red-600"}',
      '',
      ':::',
      '',
      ':::'
    ].join('\n')
    render(<MarkdownRunner markdown={md} />)
    const items = Array.from(document.querySelectorAll('li'))
    expect(document.querySelectorAll('ul')).toHaveLength(1)
    expect(items).toHaveLength(2)
    expect(items[0].textContent).toBe('apple')
    expect(items[1].textContent).toBe('cherry')
  })
})
