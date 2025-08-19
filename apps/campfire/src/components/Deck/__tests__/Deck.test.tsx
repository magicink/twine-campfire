import { beforeEach, describe, expect, it } from 'bun:test'
import { act, fireEvent, render, screen } from '@testing-library/preact'
import { Deck } from '@campfire/components/Deck'
import { Appear, Slide } from '@campfire/components/Deck/Slide'
import { useDeckStore } from '@campfire/state/useDeckStore'
import { StubAnimation } from '@campfire/test-utils/stub-animation'

/**
 * Resets the deck store to a clean initial state.
 */
const resetStore = () => {
  useDeckStore.getState().reset()
}

// Minimal ResizeObserver stub for the tests
class StubResizeObserver {
  observe() {}
  disconnect() {}
}

beforeEach(() => {
  ;(globalThis as any).ResizeObserver = StubResizeObserver
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

  it('advances and reverses slides via click and keyboard', () => {
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
    expect(useDeckStore.getState().currentSlide).toBe(1)
    expect(screen.getAllByText('Slide 2')[0]).toBeInTheDocument()
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
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
      o?: number | KeyframeAnimationOptions
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

  it.skip('sets max steps once for multiple Appear elements', async () => {
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
          <Appear at={0}>One</Appear>
          <Appear at={1}>Two</Appear>
          <Appear at={2}>Three</Appear>
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
          <Appear at={0}>One</Appear>
          <Appear at={1}>Two</Appear>
          <Appear at={2}>Three</Appear>
        </Slide>
        <Slide>
          <Appear>Only</Appear>
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
})
