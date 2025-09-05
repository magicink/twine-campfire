import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import type { ComponentChild } from 'preact'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { renderDirectiveMarkdown } from '@campfire/components/Deck/Slide'
import { getSvgClassName } from '@campfire/test-utils/helpers'
import { useGameStore } from '@campfire/state/useGameStore'

let output: ComponentChild | null = null

/**
 * Component used in tests to render markdown with directive handlers.
 *
 * @param markdown - Markdown string that may include shape directives.
 * @returns Nothing; sets `output` with rendered content.
 */
const MarkdownRunner = ({ markdown }: { markdown: string }) => {
  const handlers = useDirectiveHandlers()
  output = renderDirectiveMarkdown(markdown, handlers)
  return <>{output}</>
}

beforeEach(() => {
  output = null
  document.body.innerHTML = ''
  ;(HTMLElement.prototype as any).animate = () => ({
    finished: Promise.resolve(),
    cancel: () => {},
    finish: () => {}
  })
})

describe('shape directive', () => {
  it('renders a SlideShape component with props', () => {
    const md =
      ':::reveal\n:shape{x=10 y=20 w=100 h=50 type="rect" stroke="red" fill="blue" radius=5 shadow=true className="rounded" layerClassName="wrapper" data-test="ok"}\n:::\n'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector(
      '[data-testid="slideShape"]'
    ) as HTMLElement
    expect(el).toBeTruthy()
    expect(el.className).toContain('campfire-layer')
    expect(el.className).toContain('campfire-slide-layer')
    expect(el.className).toContain('wrapper')
    expect(el.style.left).toBe('10px')
    expect(el.style.top).toBe('20px')
    expect(el.style.width).toBe('100px')
    expect(el.style.height).toBe('50px')
    expect(el.getAttribute('data-test')).toBe('ok')
    const svg = el.querySelector('svg') as SVGSVGElement
    const rect = svg.querySelector('rect') as SVGRectElement
    expect(rect.getAttribute('stroke')).toBe('red')
    expect(rect.getAttribute('fill')).toBe('blue')
    expect(rect.getAttribute('rx')).toBe('5')
    expect(getSvgClassName(svg)).toContain('campfire-slide-shape')
    expect(svg.classList.contains('rounded')).toBe(true)
    expect(svg.style.filter).toContain('drop-shadow')
  })

  it('interpolates className, layerClassName, and style', () => {
    useGameStore.setState({
      gameData: { cls: 'rounded', layer: 'wrapper', border: '1px solid red' }
    })
    const md =
      ':::reveal\n:shape{type="rect" x=10 y=20 className="${cls}" layerClassName="${layer}" style="border:${border}"}\n:::\n'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector(
      '[data-testid="slideShape"]'
    ) as HTMLElement
    expect(el.className).toContain('wrapper')
    const svg = el.querySelector('svg') as SVGSVGElement
    expect(svg.classList.contains('rounded')).toBe(true)
    expect(svg.style.border).toBe('1px solid red')
  })

  it('interpolates id and stroke attributes', () => {
    useGameStore.setState({
      gameData: { sid: 'shape-1', stroke: 'green' }
    })
    const md =
      ':::reveal\n:shape{type="rect" id="${sid}" stroke="${stroke}"}\n:::\n'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector(
      '[data-testid="slideShape"]'
    ) as HTMLElement
    const svg = el.querySelector('svg') as SVGSVGElement
    expect(svg.id).toBe('shape-1')
    const rect = svg.querySelector('rect') as SVGRectElement
    expect(rect.getAttribute('stroke')).toBe('green')
  })

  it('renders a SlideShape component with props via leaf directive', () => {
    const md =
      ':::reveal\n::shape{x=10 y=20 w=100 h=50 type="rect" stroke="red" fill="blue" radius=5 shadow=true className="rounded" layerClassName="wrapper" data-test="ok"}\n:::\n'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector(
      '[data-testid="slideShape"]'
    ) as HTMLElement
    expect(el).toBeTruthy()
    expect(el.className).toContain('campfire-layer')
    expect(el.className).toContain('campfire-slide-layer')
    expect(el.className).toContain('wrapper')
    expect(el.style.left).toBe('10px')
    expect(el.style.top).toBe('20px')
    expect(el.style.width).toBe('100px')
    expect(el.style.height).toBe('50px')
    expect(el.getAttribute('data-test')).toBe('ok')
    const svg = el.querySelector('svg') as SVGSVGElement
    const rect = svg.querySelector('rect') as SVGRectElement
    expect(rect.getAttribute('stroke')).toBe('red')
    expect(rect.getAttribute('fill')).toBe('blue')
    expect(rect.getAttribute('rx')).toBe('5')
    expect(getSvgClassName(svg)).toContain('campfire-slide-shape')
    expect(svg.classList.contains('rounded')).toBe(true)
    expect(svg.style.filter).toContain('drop-shadow')
  })

  it('applies shape presets with overrides', () => {
    const md =
      ':preset{type="shape" name="box" x=5 y=5 w=10 h=10 fill="red"}\n:::reveal\n:shape{from="box" y=20 type="rect"}\n:::\n'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector(
      '[data-testid="slideShape"]'
    ) as HTMLElement
    expect(el.style.left).toBe('5px')
    expect(el.style.top).toBe('20px')
    const svg = el.querySelector('svg') as SVGSVGElement
    const rect = svg.querySelector('rect') as SVGRectElement
    expect(rect.getAttribute('fill')).toBe('red')
  })

  it('does not render stray colons after shape blocks', () => {
    const md = '::shape{type="rect"}\n:::if[true]\nHi\n:::\n'
    render(<MarkdownRunner markdown={md} />)
    const text = document.body.textContent || ''
    expect(text).not.toContain(':::')
  })
})
