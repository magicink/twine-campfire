import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
  spyOn
} from 'bun:test'
import { render } from '@testing-library/preact'
import type { ComponentChild } from 'preact'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { renderDirectiveMarkdown } from '@campfire/components/Deck/Slide'
import { useGameStore } from '@campfire/state/useGameStore'
import { GlobalRegistrator } from '@happy-dom/global-registrator'

let didRegisterHappyDom = false

beforeAll(() => {
  if (typeof document === 'undefined') {
    GlobalRegistrator.register()
    didRegisterHappyDom = true
  }
})

afterAll(async () => {
  if (didRegisterHappyDom) {
    await GlobalRegistrator.unregister()
  }
})

let output: ComponentChild | null = null

/**
 * Component used in tests to render markdown with directive handlers.
 *
 * @param markdown - Markdown string that may include directive containers.
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
  useGameStore.getState().clearErrors()
})

describe('text directive', () => {
  it('renders a SlideText component with styles', () => {
    const md =
      ':::text{x=10 y=20 w=100 h=50 z=5 rotate=45 scale=1.5 anchor=center as="h2" align=center size=24 weight=700 lineHeight=1.2 color="red" className="underline" layerClassName="wrapper" style="background: blue" data-test="ok"}\nHello\n:::'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector(
      '[data-testid="slideText"]'
    ) as HTMLElement
    expect(el).toBeTruthy()
    expect(el.className).toContain('campfire-layer')
    expect(el.className).toContain('campfire-slide-layer')
    expect(el.className).toContain('wrapper')
    const inner = el.firstElementChild as HTMLElement
    expect(inner.tagName).toBe('H2')
    const rawStyle = inner.getAttribute('style') || ''
    const style = rawStyle
      .split(';')
      .filter(Boolean)
      .map(rule => {
        const [prop, ...rest] = rule.split(':')
        const name = prop.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        return [name, rest.join(':').trim()]
      })
    const styleObj = Object.fromEntries(style)
    expect(styleObj.position).toBe('absolute')
    expect(styleObj.left).toBe('10px')
    expect(styleObj.top).toBe('20px')
    expect(styleObj.width).toBe('100px')
    expect(styleObj.height).toBe('50px')
    expect(styleObj.zIndex).toBe('5')
    expect(styleObj.transform).toContain('rotate(45deg)')
    expect(styleObj.transform).toContain('scale(1.5)')
    expect(styleObj.transformOrigin).toBe('50% 50%')
    expect(styleObj.textAlign).toBe('center')
    expect(styleObj.fontSize).toBe('24px')
    expect(styleObj.fontWeight).toBe('700')
    expect(styleObj.lineHeight).toBe('1.2')
    expect(styleObj.color).toBe('red')
    expect(styleObj.background).toBe('blue')
    expect(inner.className.split(' ')).toEqual(
      expect.arrayContaining([
        'campfire-slide-text',
        'underline',
        'text-base',
        'font-normal'
      ])
    )
    expect(el.getAttribute('data-test')).toBe('ok')
    expect(inner.textContent).toBe('Hello')
  })

  it('merges inline style with computed values', () => {
    const md =
      ':::text{x=10 color="red" style="color: blue; font-weight:900"}\nHi\n:::'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector(
      '[data-testid="slideText"]'
    ) as HTMLElement
    const inner = el.firstElementChild as HTMLElement
    const rawStyle = inner.getAttribute('style') || ''
    expect(rawStyle).toContain('left: 10px')
    expect(rawStyle).toContain('color: blue')
    expect(rawStyle).toContain('font-weight: 900')
    expect(inner.textContent).toBe('Hi')
  })

  it('interpolates className and style attributes', () => {
    const md = `::set[color="red" cls="big"]
:::text{className="title-\${cls}" style="color: \${color}"}
Hi
:::`
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector(
      '[data-testid="slideText"]'
    ) as HTMLElement
    const inner = el.firstElementChild as HTMLElement
    expect(inner.className.split(' ')).toEqual(
      expect.arrayContaining(['campfire-slide-text', 'title-big'])
    )
    expect(inner.style.color).toBe('red')
  })

  it('throws when using reserved class attribute', () => {
    const md = ':::text{class="bad"}\nOops\n:::'
    const errorSpy = spyOn(console, 'error').mockImplementation(() => {})
    try {
      expect(() => render(<MarkdownRunner markdown={md} />)).toThrow(
        'class is a reserved attribute. Use className instead.'
      )
      expect(errorSpy).toHaveBeenCalledWith(
        'class is a reserved attribute. Use className instead.'
      )
    } finally {
      errorSpy.mockRestore()
    }
  })

  it('applies text presets with overrides', () => {
    const md =
      '::preset{type="text" name="title" x=10 y=20 size=24 color="red"}\n:::text{from="title" size=32}\nHi\n:::'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector(
      '[data-testid="slideText"]'
    ) as HTMLElement
    const inner = el.firstElementChild as HTMLElement
    const style = inner.getAttribute('style') || ''
    expect(style).toContain('left: 10px')
    expect(style).toContain('top: 20px')
    expect(style).toContain('font-size: 32px')
    expect(style).toContain('color: red')
  })

  it('applies text presets defined with leaf directives', () => {
    const md =
      '::preset{type="text" name="headline" x=12 y=24 size=28 color="blue"}\n' +
      ':::text{from="headline" size=36}\nHello\n:::'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector(
      '[data-testid="slideText"]'
    ) as HTMLElement
    const inner = el.firstElementChild as HTMLElement
    const style = inner.getAttribute('style') || ''
    expect(style).toContain('left: 12px')
    expect(style).toContain('top: 24px')
    expect(style).toContain('font-size: 36px')
    expect(style).toContain('color: blue')
  })

  it('records an error when preset is used as a container directive', () => {
    const store = useGameStore.getState()
    store.clearErrors()
    const errorSpy = spyOn(console, 'error').mockImplementation(() => {})
    const md =
      ':::preset{type="text" name="headline" x=12 y=24 size=28 color="blue"}\n' +
      ':::text{from="headline" size=36}\nHello\n:::'
    try {
      render(<MarkdownRunner markdown={md} />)
      expect(useGameStore.getState().errors).toContain(
        'preset can only be used as a leaf directive'
      )
      expect(errorSpy).toHaveBeenCalledWith(
        'preset can only be used as a leaf directive'
      )
    } finally {
      store.clearErrors()
      errorSpy.mockRestore()
    }
  })
})
