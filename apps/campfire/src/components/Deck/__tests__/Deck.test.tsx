import { beforeEach, describe, expect, it } from 'bun:test'
import { act, fireEvent, render, screen } from '@testing-library/preact'
import { Deck } from '@campfire/components/Deck'
import { SlideReveal, Slide } from '@campfire/components/Deck/Slide'
import { LinkButton } from '@campfire/components'
import { useDeckStore } from '@campfire/state/useDeckStore'
import { StubAnimation } from '@campfire/test-utils/stub-animation'
import { setupResizeObserver } from '@campfire/test-utils/helpers'

/**
 * Resets the deck store to a clean initial state.
 */
const resetStore = () => {
  useDeckStore.getState().reset()
}

beforeEach(() => {
  setupResizeObserver()
  resetStore()
  document.body.innerHTML = ''
  HTMLElement.prototype.animate = () =>
    ({
      finished: Promise.resolve({} as Animation),
      cancel() {},
      finish() {}
    }) as unknown as Animation
})

describe('Deck', () => {
  it('sets slide count and renders the current slide', () => {
    render(
      <Deck>
        <div>Slide 1</div>
        <div>Slide 2</div>
      </Deck>
    )
    expect(useDeckStore.getState().slidesCount).toBe(2)
    const deckEl = screen.getByTestId('deck')
    expect(deckEl.className).toContain('campfire-deck')
    expect(screen.getByText('Slide 1')).toBeInTheDocument()
  })

  it('does not apply default backgrounds', () => {
    const { container } = render(
      <Deck>
        <div>Slide 1</div>
      </Deck>
    )
    expect(container.firstChild).not.toHaveClass(
      'bg-gray-100',
      'dark:bg-gray-900'
    )
  })

  it('applies custom groupClassName to the slide wrapper', () => {
    const custom = 'rounded-none shadow-none'
    render(
      <Deck groupClassName={custom}>
        <div>Slide 1</div>
      </Deck>
    )
    const group = screen.getByTestId('deck-group')
    expect(group.className).toContain('rounded-none')
    expect(group.className).toContain('shadow-none')
  })

  it('applies custom navClassName to the navigation wrapper', () => {
    const custom = 'bottom-0'
    render(
      <Deck navClassName={custom}>
        <div>Slide 1</div>
      </Deck>
    )
    const nav = screen.getByTestId('deck-nav')
    expect(nav.className).toContain('bottom-0')
  })

  it('applies custom hudClassName to the slide counter', () => {
    const custom = 'left-3 right-auto'
    render(
      <Deck showSlideCount hudClassName={custom}>
        <div>Slide 1</div>
      </Deck>
    )
    const hud = screen.getByTestId('deck-hud')
    expect(hud.className).toContain('left-3')
    expect(hud.className).toContain('right-auto')
  })

  it('applies custom navButtonClassName to all navigation buttons', () => {
    const custom = 'text-[var(--color-indigo-500)]'
    render(
      <Deck navButtonClassName={custom}>
        <div>Slide 1</div>
        <div>Slide 2</div>
      </Deck>
    )
    expect(screen.getByTestId('deck-prev').className).toContain(custom)
    expect(screen.getByTestId('deck-autoplay-toggle').className).toContain(
      custom
    )
    expect(screen.getByTestId('deck-next').className).toContain(custom)
  })

  it('applies custom rewindButtonClassName only to the rewind button', () => {
    const custom = 'text-[var(--color-red-500)]'
    render(
      <Deck rewindButtonClassName={custom}>
        <div>Slide 1</div>
        <div>Slide 2</div>
      </Deck>
    )
    expect(screen.getByTestId('deck-prev').className).toContain(custom)
    expect(screen.getByTestId('deck-autoplay-toggle').className).not.toContain(
      custom
    )
    expect(screen.getByTestId('deck-next').className).not.toContain(custom)
  })

  it('applies custom playButtonClassName only to the autoplay button', () => {
    const custom = 'text-[var(--color-red-500)]'
    render(
      <Deck playButtonClassName={custom}>
        <div>Slide 1</div>
        <div>Slide 2</div>
      </Deck>
    )
    expect(screen.getByTestId('deck-autoplay-toggle').className).toContain(
      custom
    )
    expect(screen.getByTestId('deck-prev').className).not.toContain(custom)
    expect(screen.getByTestId('deck-next').className).not.toContain(custom)
  })

  it('applies custom fastForwardButtonClassName only to the fast-forward button', () => {
    const custom = 'text-[var(--color-red-500)]'
    render(
      <Deck fastForwardButtonClassName={custom}>
        <div>Slide 1</div>
        <div>Slide 2</div>
      </Deck>
    )
    expect(screen.getByTestId('deck-next').className).toContain(custom)
    expect(screen.getByTestId('deck-prev').className).not.toContain(custom)
    expect(screen.getByTestId('deck-autoplay-toggle').className).not.toContain(
      custom
    )
  })

  it('applies custom slideHudClassName to the slide count element', () => {
    const custom = 'font-bold'
    render(
      <Deck showSlideCount slideHudClassName={custom}>
        <div>Slide 1</div>
      </Deck>
    )
    const hud = screen.getByTestId('deck-slide-hud')
    expect(hud.className).toContain('font-bold')
  })

  it('advances and reverses slides via keyboard', () => {
    render(
      <Deck>
        <div>Slide 1</div>
        <div>Slide 2</div>
      </Deck>
    )
    const inner = screen.getByText('Slide 1').parentElement as HTMLElement
    act(() => {
      fireEvent.click(inner)
    })
    expect(useDeckStore.getState().currentSlide).toBe(0)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    })
    expect(useDeckStore.getState().currentSlide).toBe(1)
    expect(screen.getAllByText('Slide 2')[0]).toBeInTheDocument()
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    })
    expect(useDeckStore.getState().currentSlide).toBe(0)
  })

  it('does not advance slides when clicking a LinkButton', () => {
    render(
      <Deck>
        <div>
          <LinkButton>Go</LinkButton>
        </div>
        <div>Slide 2</div>
      </Deck>
    )
    const btn = screen.getByTestId('link-button')
    act(() => {
      fireEvent.click(btn)
    })
    expect(useDeckStore.getState().currentSlide).toBe(0)
  })

  it('navigates using prev and next buttons', () => {
    render(
      <Deck>
        <div>Slide 1</div>
        <div>Slide 2</div>
      </Deck>
    )
    const nextBtn = screen.getByTestId('deck-next')
    act(() => {
      fireEvent.click(nextBtn)
    })
    expect(useDeckStore.getState().currentSlide).toBe(1)
    const prevBtn = screen.getByTestId('deck-prev')
    act(() => {
      fireEvent.click(prevBtn)
    })
    expect(useDeckStore.getState().currentSlide).toBe(0)
  })

  it('prevents navigation button clicks from bubbling', () => {
    let clicked = false
    render(
      <div
        onClick={() => {
          clicked = true
        }}
      >
        <Deck>
          <div>Slide 1</div>
          <div>Slide 2</div>
        </Deck>
      </div>
    )
    const nextBtn = screen.getByTestId('deck-next')
    act(() => {
      fireEvent.click(nextBtn)
    })
    expect(clicked).toBe(false)
    expect(useDeckStore.getState().currentSlide).toBe(1)
  })

  it('disables navigation buttons at deck bounds', () => {
    render(
      <Deck>
        <div>Slide 1</div>
        <div>Slide 2</div>
      </Deck>
    )
    const prevBtn = screen.getByTestId('deck-prev') as HTMLButtonElement
    const nextBtn = screen.getByTestId('deck-next') as HTMLButtonElement
    expect(prevBtn).toBeDisabled()
    expect(nextBtn).not.toBeDisabled()
    act(() => {
      fireEvent.click(nextBtn)
    })
    expect(prevBtn).not.toBeDisabled()
    expect(nextBtn).toBeDisabled()
  })

  it('always renders the autoplay control', () => {
    render(
      <Deck>
        <div>Slide 1</div>
        <div>Slide 2</div>
      </Deck>
    )
    expect(screen.getByTestId('deck-autoplay-toggle')).toBeInTheDocument()
  })

  it('can hide navigation controls', () => {
    render(
      <Deck hideNavigation>
        <div>Slide 1</div>
      </Deck>
    )
    expect(screen.queryByTestId('deck-nav')).toBeNull()
  })

  it('jumps to start or end using Home and End keys', () => {
    render(
      <Deck>
        <div>Slide 1</div>
        <div>Slide 2</div>
        <div>Slide 3</div>
      </Deck>
    )
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }))
    })
    expect(useDeckStore.getState().currentSlide).toBe(2)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }))
    })
    expect(useDeckStore.getState().currentSlide).toBe(0)
  })

  it('auto advances slides when configured', async () => {
    render(
      <Deck autoAdvanceMs={10}>
        <div>Slide 1</div>
        <div>Slide 2</div>
      </Deck>
    )
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 15))
    })
    expect(useDeckStore.getState().currentSlide).toBe(1)
  })

  it('pauses and resumes autoplay with the toggle button', async () => {
    render(
      <Deck autoAdvanceMs={10} autoAdvancePaused>
        <div>Slide 1</div>
        <div>Slide 2</div>
        <div>Slide 3</div>
      </Deck>
    )
    const toggle = screen.getByTestId('deck-autoplay-toggle')
    expect(toggle.textContent).toBe('▶')
    expect(toggle).toHaveAttribute('data-state', 'paused')
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20))
    })
    expect(useDeckStore.getState().currentSlide).toBe(0)
    act(() => {
      fireEvent.click(toggle)
    })
    expect(toggle.textContent).toBe('⏸')
    expect(toggle).toHaveAttribute('data-state', 'playing')
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 15))
    })
    expect(useDeckStore.getState().currentSlide).toBe(1)
    act(() => {
      fireEvent.click(toggle)
    })
    expect(toggle.textContent).toBe('▶')
    expect(toggle).toHaveAttribute('data-state', 'paused')
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 15))
    })
    expect(useDeckStore.getState().currentSlide).toBe(1)
  })

  it('resets deck state when unmounted', () => {
    const { unmount } = render(
      <Deck>
        <div>One</div>
        <div>Two</div>
      </Deck>
    )
    act(() => {
      useDeckStore.getState().next()
    })
    expect(useDeckStore.getState().currentSlide).toBe(1)
    act(() => {
      unmount()
    })
    expect(useDeckStore.getState().currentSlide).toBe(0)
    expect(useDeckStore.getState().slidesCount).toBe(0)
  })

  it('applies slide transition type and duration', async () => {
    const calls: Array<{
      keyframes: Keyframe[]
      options: KeyframeAnimationOptions
    }> = []
    HTMLElement.prototype.animate = (
      k: Keyframe[] | PropertyIndexedKeyframes,
      o?: number | KeyframeAnimationOptions
    ) => {
      calls.push({
        keyframes: k as Keyframe[],
        options: o as KeyframeAnimationOptions
      })
      return new StubAnimation() as unknown as Animation
    }
    render(
      <Deck>
        <Slide transition={{ exit: { type: 'zoom', duration: 500 } }}>
          One
        </Slide>
        <Slide>Two</Slide>
      </Deck>
    )
    await act(() => {
      useDeckStore.getState().next()
    })
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    const zoomCall = calls.find(c => c.options.duration === 500)
    expect(zoomCall).toBeTruthy()
    expect(zoomCall?.keyframes[0].transform).toBe('scale(1)')
  })

  it('runs enter animation when slide changes', async () => {
    const calls: Array<{ keyframes: Keyframe[] }> = []
    HTMLElement.prototype.animate = (
      k: Keyframe[] | PropertyIndexedKeyframes,
      _o?: number | KeyframeAnimationOptions
    ) => {
      calls.push({ keyframes: k as Keyframe[] })
      return new StubAnimation() as unknown as Animation
    }
    render(
      <Deck>
        <Slide>One</Slide>
        <Slide>Two</Slide>
      </Deck>
    )
    await act(() => {
      useDeckStore.getState().next()
    })
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    const enterCall = calls.find(
      c => c.keyframes[0].opacity === 0 && c.keyframes.at(-1)?.opacity === 1
    )
    expect(enterCall).toBeTruthy()
  })

  it('advances without extra interaction for slides without steps', async () => {
    HTMLElement.prototype.animate = () =>
      new StubAnimation() as unknown as Animation
    const { unmount } = render(
      <Deck>
        <Slide steps={1}>One</Slide>
        <Slide transition={{ type: 'slide' }}>Two</Slide>
        <Slide>Three</Slide>
      </Deck>
    )
    await act(async () => {
      useDeckStore.getState().next()
    })
    await act(async () => {
      useDeckStore.getState().next()
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    await act(async () => {
      useDeckStore.getState().next()
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    expect(useDeckStore.getState().currentSlide).toBe(2)
    unmount()
  })

  it('hides slide counter by default', () => {
    render(
      <Deck>
        <Slide>Slide 1</Slide>
      </Deck>
    )
    expect(screen.queryByTestId('deck-slide-hud')).toBeNull()
  })

  it('shows slide counter when enabled', () => {
    render(
      <Deck showSlideCount>
        <Slide>Slide 1</Slide>
      </Deck>
    )
    const slideHud = screen.getByTestId('deck-slide-hud')
    expect(slideHud.textContent).toBe('Slide 1 / 1')
  })

  it('positions HUD away from navigation buttons', () => {
    render(
      <Deck showSlideCount>
        <Slide>Slide 1</Slide>
      </Deck>
    )
    const hud = screen.getByTestId('deck-hud')
    const nav = screen.getByTestId('deck-nav')
    expect(hud.className).toContain('top-3')
    expect(hud.className).toContain('right-3')
    expect(nav.className).toContain('bottom-2')
  })

  it('overrides accessible labels with the a11y prop', () => {
    render(
      <Deck
        showSlideCount
        a11y={{
          deck: 'Slide deck',
          next: 'Forward',
          prev: 'Back',
          play: 'Start autoplay',
          pause: 'Pause autoplay',
          slide: (i: number, t: number) => `Page ${i} of ${t}`
        }}
      >
        <Slide>One</Slide>
        <Slide>Two</Slide>
      </Deck>
    )
    expect(screen.getByTestId('deck')).toHaveAttribute(
      'aria-label',
      'Slide deck'
    )
    expect(screen.getByTestId('deck-next')).toHaveAttribute(
      'aria-label',
      'Forward'
    )
    expect(screen.getByTestId('deck-prev')).toHaveAttribute(
      'aria-label',
      'Back'
    )
    expect(screen.getByTestId('deck-autoplay-toggle')).toHaveAttribute(
      'aria-label',
      'Start autoplay'
    )
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
  })

  it.skip('sets max steps once for multiple SlideReveal elements', async () => {
    const original = useDeckStore.getState().setMaxSteps
    const calls: number[] = []
    useDeckStore.setState({
      setMaxSteps: (n: number) => {
        calls.push(n)
        original(n)
      }
    })

    render(
      <Deck>
        <Slide>
          <SlideReveal at={0}>One</SlideReveal>
          <SlideReveal at={1}>Two</SlideReveal>
          <SlideReveal at={2}>Three</SlideReveal>
        </Slide>
      </Deck>
    )

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(calls).toEqual([2])
    useDeckStore.setState({ setMaxSteps: original })
  })

  it.skip('preloads steps to prevent HUD flicker between slides', () => {
    render(
      <Deck>
        <Slide>
          <SlideReveal at={0}>One</SlideReveal>
          <SlideReveal at={1}>Two</SlideReveal>
          <SlideReveal at={2}>Three</SlideReveal>
        </Slide>
        <Slide>
          <SlideReveal>Only</SlideReveal>
        </Slide>
      </Deck>
    )

    act(() => {
      const api = useDeckStore.getState()
      api.next()
      api.next()
      api.next()
    })

    expect(useDeckStore.getState().maxSteps).toBe(1)
  })

  it.skip('keeps autoplay paused after rewinding from the end', async () => {
    render(
      <Deck autoAdvanceMs={20}>
        <div>Slide 1</div>
        <div>Slide 2</div>
      </Deck>
    )
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 25))
    })
    expect(useDeckStore.getState().currentSlide).toBe(1)
    const prevBtn = screen.getByTestId('deck-prev')
    await act(async () => {
      fireEvent.click(prevBtn)
    })
    expect(useDeckStore.getState().currentSlide).toBe(0)
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 30))
    })
    expect(useDeckStore.getState().currentSlide).toBe(0)
  })

  it.skip('stops autoplay after the final reveal of the last slide', async () => {
    render(
      <Deck autoAdvanceMs={20}>
        <Slide>Slide 1</Slide>
        <Slide>
          <SlideReveal at={0}>One</SlideReveal>
          <SlideReveal at={1}>Two</SlideReveal>
        </Slide>
      </Deck>
    )
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 25))
    })
    expect(useDeckStore.getState().currentSlide).toBe(1)
    expect(useDeckStore.getState().currentStep).toBe(0)
    const toggle = screen.getByTestId('deck-autoplay-toggle')
    expect(toggle).toHaveTextContent('⏸')
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 25))
    })
    expect(useDeckStore.getState().currentSlide).toBe(1)
    expect(useDeckStore.getState().currentStep).toBe(1)
    expect(toggle).toHaveTextContent('▶')
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 25))
    })
    expect(useDeckStore.getState().currentSlide).toBe(1)
    expect(useDeckStore.getState().currentStep).toBe(1)
  })
})
