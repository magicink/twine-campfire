import { describe, it, expect, beforeEach } from 'bun:test'
import { render } from '@testing-library/preact'
import type { ComponentChild } from 'preact'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { renderDirectiveMarkdown } from '@campfire/components/Deck/Slide'
import { useGameStore } from '@campfire/state/useGameStore'
import { resetStores } from '@campfire/test-utils/helpers'

let output: ComponentChild | null = null

/**
 * Component used in tests to render markdown with directive handlers.
 *
 * @param markdown - Markdown string that may include layer directives.
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
  resetStores()
})

describe('layer directive', () => {
  it('renders a Layer component with props', () => {
    const md =
      ':::layer{x=10 y=20 w=30 h=40 z=5 rotate=45 scale=2 anchor="center" className="box" data-test="ok"}\nContent\n:::'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector('[data-testid="layer"]') as HTMLElement
    expect(el).toBeTruthy()
    expect(el.tagName).toBe('DIV')
    expect(el.style.left).toBe('10px')
    expect(el.style.top).toBe('20px')
    expect(el.style.width).toBe('30px')
    expect(el.style.height).toBe('40px')
    expect(el.style.zIndex).toBe('5')
    expect(el.style.transform).toBe('rotate(45deg) scale(2)')
    expect(el.style.transformOrigin).toBe('50% 50%')
    expect(el.className).toContain('campfire-layer')
    expect(el.className).toContain('box')
    expect(el.getAttribute('data-test')).toBe('ok')
    expect(el.textContent).toContain('Content')
  })

  it('applies layer presets with overrides for numeric fields', () => {
    const md =
      '::preset{type="layer" name="base" x=5 y=5 w=50 h=60 z=2 rotate=15 scale=2 anchor="center"}\n' +
      ':::layer{from="base" y=10 w=40 rotate=30 anchor="bottom-right"}\nHi\n:::'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector('[data-testid="layer"]') as HTMLElement
    expect(el.style.left).toBe('5px')
    expect(el.style.top).toBe('10px')
    expect(el.style.width).toBe('40px')
    expect(el.style.height).toBe('60px')
    expect(el.style.zIndex).toBe('2')
    expect(el.style.transform).toBe('rotate(30deg) scale(2)')
    expect(el.style.transformOrigin).toBe('100% 100%')
  })

  it('uses anchor from presets when not overridden', () => {
    const md =
      '::preset{type="layer" name="base" x=1 y=2 anchor="center"}\n:::layer{from="base"}\nHi\n:::'
    render(<MarkdownRunner markdown={md} />)
    const el = document.querySelector('[data-testid="layer"]') as HTMLElement
    expect(el.style.transformOrigin).toBe('50% 50%')
  })

  it('handles nested container directives without stray markers', () => {
    const md =
      ':::layer{className="flex gap-[4px] items-center justify-center"}\n' +
      ':::wrapper{as="div"}\n' +
      ':radio[choice]{value="a"}\n' +
      ':::\n' +
      ':radio[choice]{value="b" checked}\n' +
      ':radio[choice]{value="c" disabled="true"}\n' +
      ':::\n'
    render(<MarkdownRunner markdown={md} />)
    expect(
      document.querySelector(
        '[data-testid="layer"] + [data-testid="wrapper"]'
      ) === null
    ).toBe(true)
    expect(document.body.innerHTML).not.toContain(':::')
  })

  it('renders siblings after wrappers with nested containers', () => {
    const md =
      '::set[show=true]\n' +
      ':::layer{className="flex gap-[4px] items-center justify-center"}\n' +
      ':::wrapper{as="div"}\n' +
      ':radio[choice]{value="a"}\n' +
      ':::\n' +
      ':::wrapper{as="div"}\n' +
      ':radio[choice]{value="b" checked}\n' +
      ':::if[show]\n' +
      'Hello\n' +
      ':::\n' +
      ':::\n' +
      ':::wrapper{as="div"}\n' +
      ':radio[choice]{value="c" disabled="true"}\n' +
      ':::\n' +
      ':::\n'
    render(<MarkdownRunner markdown={md} />)
    const layerEl = document.querySelector(
      '[data-testid="layer"]'
    ) as HTMLElement
    const wrappers = layerEl.querySelectorAll('[data-testid="wrapper"]')
    expect(wrappers.length).toBe(3)
    const radios = layerEl.querySelectorAll('[data-testid="radio"]')
    expect(radios.length).toBe(3)
    expect(radios[2].hasAttribute('disabled')).toBe(true)
    expect(
      document.querySelector(
        '[data-testid="layer"] + [data-testid="wrapper"]'
      ) === null
    ).toBe(true)
  })

  it('supports leaf radio directives inside wrappers', () => {
    const md =
      '::preset{type="wrapper" name="choice" as="label" className="flex items-center gap-2"}\n' +
      ':::layer{className="space-y-3"}\n' +
      '  :::wrapper{from="choice"}\n' +
      '    ::radio[playerClass]{value="Warrior"}\n' +
      '    Warrior\n' +
      '  :::\n' +
      '  :::wrapper{from="choice"}\n' +
      '    ::radio[playerClass]{value="Mage"}\n' +
      '    Mage\n' +
      '  :::\n' +
      ':::\n'
    render(<MarkdownRunner markdown={md} />)
    const layerEl = document.querySelector(
      '[data-testid="layer"]'
    ) as HTMLElement
    const radios = layerEl.querySelectorAll('[data-testid="radio"]')
    expect(radios.length).toBe(2)
    expect(layerEl.innerHTML).not.toContain(':::')
  })

  it('preserves conditional siblings after layer directives', () => {
    useGameStore.setState({ gameData: { playerClass: 'Mage' } })
    const md = [
      ':::layer{className="space-y-2"}',
      '  :::wrapper{as="div"}',
      '    ::radio[playerClass]{value="Mage"}',
      '    Mage',
      '  :::',
      ':::',
      '',
      ':::if[(playerClass && playerClass.trim())]',
      '  :::trigger{label="Begin"}',
      '    ::goto["Next"]',
      '  :::',
      ':::'
    ].join('\n')
    render(<MarkdownRunner markdown={md} />)
    const trigger = document.querySelector(
      '[data-testid="trigger-button"]'
    ) as HTMLButtonElement
    expect(trigger).toBeTruthy()
    expect(trigger.disabled).toBe(false)
  })
})
