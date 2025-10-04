import { describe, it, beforeEach, expect, vi } from 'bun:test'
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent
} from '@testing-library/preact'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { useGameStore } from '@campfire/state/useGameStore'
import { resetStores } from '@campfire/test-utils/helpers'

/**
 * Consolidated tests for various Passage directives.
 */

/**
 * Verifies that multiple image directives render each image on a slide.
 */
describe('Passage image directive', () => {
  beforeEach(async () => {
    document.body.innerHTML = ''
    resetStores()
    ;(HTMLElement.prototype as any).animate = () => ({
      finished: Promise.resolve(),
      cancel() {},
      finish() {}
    })
    if (!i18next.isInitialized) {
      await i18next.use(initReactI18next).init({ lng: 'en-US', resources: {} })
    } else {
      await i18next.changeLanguage('en-US')
      i18next.services.resourceStore.data = {}
    }
  })

  it('renders multiple SlideImage components', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: `:::deck{size='1280x720' hideNavigation=true}\n            :::slide\n    :::reveal{at=0}\n      ::image{src='https://placecats.com/bella/1280/360'}\n\n      ::image{src='https://placecats.com/neo/250/250' x=50 y=250 className='rounded-full shadow-lg'}\n    :::\n  :::\n:::`
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const images = await screen.findAllByTestId('slideImage')
    expect(images).toHaveLength(2)
    expect(images[0].querySelector('img')?.getAttribute('src')).toBe(
      'https://placecats.com/bella/1280/360'
    )
    expect(images[1].querySelector('img')?.getAttribute('src')).toBe(
      'https://placecats.com/neo/250/250'
    )
  })
})

/**
 * Verifies that the layer directive renders the Layer component in a Passage.
 */
describe('Passage layer directive', () => {
  beforeEach(async () => {
    document.body.innerHTML = ''
    resetStores()
    if (!i18next.isInitialized) {
      await i18next.use(initReactI18next).init({ lng: 'en-US', resources: {} })
    } else {
      await i18next.changeLanguage('en-US')
      i18next.services.resourceStore.data = {}
    }
  })

  it('renders a Layer component', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':::layer{x=10}\nContent\n:::' }]
    }

    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)

    const el = await screen.findByTestId('layer')
    expect(el.tagName).toBe('DIV')
    expect(el.textContent).toContain('Content')
  })
})

/**
 * Tests rendering of the shape directive within a Passage.
 */
describe('Passage shape directive', () => {
  beforeEach(async () => {
    document.body.innerHTML = ''
    resetStores()
    const animation: Partial<Animation> = {
      finished: Promise.resolve<Animation>({} as Animation),
      cancel() {}
    }
    Object.defineProperty(HTMLElement.prototype, 'animate', {
      value: () => animation as Animation
    })
    if (!i18next.isInitialized) {
      await i18next.use(initReactI18next).init({ lng: 'en-US', resources: {} })
    } else {
      await i18next.changeLanguage('en-US')
      i18next.services.resourceStore.data = {}
    }
  })

  it('renders SlideShape components without stray markers', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::deck{size=800x600}\n:::slide\n::shape{x=10 y=20 w=100 h=50 type="rect" data-test="ok"}\n:::\n:::\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const el = await screen.findByTestId('slideShape')
    expect(el).toBeTruthy()
    expect(el.style.left).toBe('10px')
    expect(el.style.top).toBe('20px')
    expect(el.style.width).toBe('100px')
    expect(el.style.height).toBe('50px')
    expect(el.getAttribute('data-test')).toBe('ok')
    expect(document.body.innerHTML).not.toContain('<SlideShape')
    expect(document.body.textContent).not.toContain(':::')
  })
})

/**
 * Tests rendering of the text directive within a Passage.
 */
describe('Passage text directive', () => {
  beforeEach(async () => {
    document.body.innerHTML = ''
    resetStores()
    ;(HTMLElement.prototype as any).animate = () => ({
      finished: Promise.resolve(),
      cancel() {}
    })
    if (!i18next.isInitialized) {
      await i18next.use(initReactI18next).init({ lng: 'en-US', resources: {} })
    } else {
      await i18next.changeLanguage('en-US')
      i18next.services.resourceStore.data = {}
    }
  })

  it('renders SlideText components without stray markers', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::deck{size=800x600}\n:::slide\n:::text{x=80 y=80 as="h2"}\nHello\n:::\n:::\n:::\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const el = await screen.findByTestId('slideText')
    expect(el).toBeTruthy()
    expect(document.body.innerHTML).not.toContain('<SlideText')
    expect(document.body.textContent).not.toContain(':::')
  })
})

/**
 * Tests for trigger directives in Passage.
 */
describe('Passage trigger directives', () => {
  beforeEach(async () => {
    document.body.innerHTML = ''
    resetStores()
    if (!i18next.isInitialized) {
      await i18next.use(initReactI18next).init({ lng: 'en-US', resources: {} })
    } else {
      await i18next.changeLanguage('en-US')
      i18next.services.resourceStore.data = {}
    }
  })

  it('executes trigger directives on button click', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::trigger{label="Fire" className="extra"}\n::set[fired=true]\n:::\n:::'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const button = await screen.findByRole('button', { name: 'Fire' })
    expect(button.className).toContain('campfire-trigger')
    expect(button.className).toContain('extra')
    expect(button.className).toContain('bg-primary')
    act(() => {
      button.click()
    })
    await waitFor(() => {
      expect(useGameStore.getState().gameData.fired).toBe(true)
    })
  })

  it('passes style attribute to the component', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':::trigger{label="Styled" style="color:blue"}\n:::'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const button = await screen.findByRole('button', { name: 'Styled' })
    expect((button as HTMLButtonElement).style.color).toBe('blue')
  })

  it('does not run directives when trigger is disabled', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::trigger{label="Stop" disabled}\n::set[stopped=true]\n:::\n:::'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const button = await screen.findByRole('button', { name: 'Stop' })
    expect(button).toBeDisabled()
    act(() => {
      button.click()
    })
    await waitFor(() => {
      expect(useGameStore.getState().gameData.stopped).toBeUndefined()
    })
  })

  it('respects disabled=false attribute', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::trigger{label="Go" disabled=false}\n::set[go=true]\n:::\n:::'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const button = await screen.findByRole('button', { name: 'Go' })
    expect(button).not.toBeDisabled()
    act(() => {
      button.click()
    })
    await waitFor(() => {
      expect(useGameStore.getState().gameData.go).toBe(true)
    })
  })

  it('ignores unquoted label attributes', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':::trigger{label=Fire}\n::set[fired=true]\n:::\n:::'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const button = await screen.findByRole('button')
    expect(screen.queryByRole('button', { name: 'Fire' })).toBeNull()
    expect(button.textContent).toBe('')
  })

  it('runs event directives for trigger blocks', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::trigger{label="Do"}\n:::onMouseEnter\n::set[hovered=true]\n:::\n:::onFocus\n::set[focused=true]\n:::\n:::onBlur\n::set[blurred=true]\n:::\n::set[clicked=true]\n:::\n'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    const button = await screen.findByRole('button', { name: 'Do' })
    fireEvent.mouseEnter(button)
    expect(useGameStore.getState().gameData.hovered).toBe(true)
    fireEvent.focus(button)
    expect(useGameStore.getState().gameData.focused).toBe(true)
    fireEvent.blur(button)
    expect(useGameStore.getState().gameData.blurred).toBe(true)
    act(() => {
      button.click()
    })
    await waitFor(() => {
      expect(useGameStore.getState().gameData.clicked).toBe(true)
    })
  })

  it('removes directive markers after trigger blocks', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: ':::trigger{label="Fire"}\n::set[fired=true]\n:::\n:::'
        }
      ]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(<Passage />)
    await screen.findByRole('button', { name: 'Fire' })
    expect(document.body.textContent).not.toContain(':::')
  })

  it('stops click propagation', async () => {
    let clicked = false
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [{ type: 'text', value: ':::trigger{label="Fire"}\n:::' }]
    }
    useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
    render(
      <div
        onClick={() => {
          clicked = true
        }}
      >
        <Passage />
      </div>
    )
    const button = await screen.findByRole('button', { name: 'Fire' })
    fireEvent.click(button)
    expect(clicked).toBe(false)
  })

  it('uses wrapper child as the trigger label, overriding label attribute', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::trigger{label="Ignored"}\n' +
            ':::wrapper{as="span" className="fancy"}\n' +
            'Styled Label\n' +
            ':::\n' +
            '::set[fired=true]\n' +
            ':::\n' +
            ':::'
        }
      ]
    }
    try {
      useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
      render(<Passage />)
      const button = await screen.findByRole('button', { name: 'Styled Label' })
      const wrapper = button.querySelector(
        '[data-testid="wrapper"]'
      ) as HTMLElement
      expect(wrapper).toBeTruthy()
      expect(wrapper.className).toContain('campfire-wrapper')
      expect(wrapper.className).toContain('fancy')
      act(() => {
        button.click()
      })
      await waitFor(() => {
        expect(useGameStore.getState().gameData.fired).toBe(true)
      })
      expect(errorSpy).toHaveBeenCalledWith(
        'Only one wrapper directive is allowed inside a trigger'
      )
    } finally {
      errorSpy.mockRestore()
    }
  })

  it('enforces a single wrapper inside trigger and coerces invalid wrapper tag to span', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::trigger{label="Fallback"}\n' +
            ':::wrapper{as="p" className="first"}\n' +
            'First\n' +
            ':::\n' +
            ':::wrapper{as="div" className="second"}\n' +
            'Second\n' +
            ':::\n' +
            ':::\n'
        }
      ]
    }
    try {
      useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
      render(<Passage />)
      const button = await screen.findByRole('button', { name: 'First' })
      const wrappers = button.querySelectorAll('[data-testid="wrapper"]')
      expect(wrappers).toHaveLength(1)
      expect((wrappers[0] as HTMLElement).tagName).toBe('SPAN')
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Only one wrapper directive is allowed inside a trigger'
        )
      )
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Wrapper inside trigger must use an inline tag allowed within <button> (e.g., as="span")'
        )
      )
    } finally {
      errorSpy.mockRestore()
    }
  })

  it('does not leave stray markers when wrapper is used as label', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value:
            ':::trigger\n' +
            ':::wrapper{as="span" className="inline-flex items-center gap-2"}\n' +
            'Label\n' +
            ':::\n' +
            ':::\n'
        }
      ]
    }
    try {
      useStoryDataStore.setState({ passages: [passage], currentPassageId: '1' })
      render(<Passage />)
      await screen.findByRole('button', { name: 'Label' })
      expect(document.body.textContent).not.toContain(':::')
      expect(errorSpy).toHaveBeenCalledWith(
        'Only one wrapper directive is allowed inside a trigger'
      )
    } finally {
      errorSpy.mockRestore()
    }
  })
})
