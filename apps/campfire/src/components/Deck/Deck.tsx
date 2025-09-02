import {
  cloneElement,
  toChildArray,
  type ComponentChild,
  type ComponentChildren,
  type JSX,
  type VNode
} from 'preact'
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'preact/hooks'
import { useDeckStore } from '@campfire/state/useDeckStore'
import { useScale, type DeckSize } from '@campfire/hooks/useScale'
import { DEFAULT_DECK_HEIGHT, DEFAULT_DECK_WIDTH } from '@campfire/constants'
import {
  defaultTransition,
  prefersReducedMotion,
  runAnimation
} from '@campfire/components/transition'
import { mergeClasses } from '@campfire/utils/core'
import { getRevealMax } from './Slide/utils'
import type { Transition, SlideTransition } from './Slide/types'

export type ThemeTokens = Record<string, string | number>

/** Accessibility label strings and generators. */
export type A11yLabels = {
  /** aria-label for the deck region. */
  deck: string
  /** Label for the "next" control. */
  next: string
  /** Label for the "previous" control. */
  prev: string
  /** Label for the autoplay pause control. */
  pause: string
  /** Label for the autoplay play control. */
  play: string
  /** Label for the current slide. */
  slide: (index: number, total: number) => string
}

/** Default interval for autoplay advances in milliseconds. */
const DEFAULT_AUTO_ADVANCE_MS = 3000

export interface DeckProps {
  size?: DeckSize
  theme?: ThemeTokens
  initialSlide?: number
  autoAdvanceMs?: number | null
  /** Whether autoplay should start in a paused state. */
  autoAdvancePaused?: boolean
  className?: string
  /** Class applied to the slide group container. */
  groupClassName?: string
  /** Class applied to the navigation wrapper. */
  navClassName?: string
  /** Class applied to the slide counter HUD wrapper. */
  hudClassName?: string
  /** Class applied to each navigation button. */
  navButtonClassName?: string
  /** Class applied to the rewind navigation button. */
  rewindButtonClassName?: string
  /** Class applied to the autoplay toggle button. */
  playButtonClassName?: string
  /** Class applied to the fast-forward navigation button. */
  fastForwardButtonClassName?: string
  /** Class applied to the slide counter within the HUD. */
  slideHudClassName?: string
  a11y?: Partial<A11yLabels>
  /** Whether to display the slide counter HUD. */
  showSlideCount?: boolean
  /** Whether to hide navigation controls. */
  hideNavigation?: boolean
  children?: ComponentChildren
  /** Optional custom deck store. */
  store?: typeof useDeckStore
}

/** Styles used to visually hide elements while remaining accessible. */
const srOnlyStyle: JSX.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0
}

/**
 * Renders a presentation deck that enables slide navigation and scaling.
 *
 * @param props - Configuration options for the deck component.
 * @returns A deck element that renders the current slide.
 */
export const Deck = ({
  size = { width: DEFAULT_DECK_WIDTH, height: DEFAULT_DECK_HEIGHT },
  theme,
  initialSlide,
  autoAdvanceMs,
  autoAdvancePaused = false,
  className,
  groupClassName,
  navClassName,
  hudClassName,
  navButtonClassName,
  rewindButtonClassName,
  playButtonClassName,
  fastForwardButtonClassName,
  slideHudClassName,
  a11y,
  showSlideCount = false,
  hideNavigation = false,
  children,
  store = useDeckStore
}: DeckProps) => {
  // TODO(campfire): Theme tokens should default to documented CSS variables
  // using oklch() values; add Storybook examples and docs showing how to
  // override via `theme` and custom properties while maintaining contrast.
  /**
   * Type guard to determine whether a child is a valid {@link VNode}.
   *
   * @param node - The child to test.
   * @returns True if the child is a {@link VNode}.
   */
  const isVNode = (node: ComponentChild): node is VNode =>
    typeof node === 'object' && node !== null && 'type' in node

  const { slides, slideSteps } = useMemo(() => {
    const nodes = toChildArray(children)
    const cloned: VNode[] = []
    const steps: number[] = []
    nodes.forEach((slide, index) => {
      if (isVNode(slide)) {
        const vnode = cloneElement(slide, { key: index }) as VNode<any>
        cloned.push(vnode)
        const explicit = vnode.props.steps ?? 0
        const revealMax = getRevealMax(vnode.props.children)
        steps.push(Math.max(explicit, revealMax))
      } else {
        cloned.push(slide as unknown as VNode<any>)
        steps.push(0)
      }
    })
    return { slides: cloned, slideSteps: steps }
  }, [children])
  const currentSlide = store(state => state.currentSlide)
  const currentStep = store(state => state.currentStep)
  const next = store(state => state.next)
  const prev = store(state => state.prev)
  const goTo = store(state => state.goTo)
  const setSlidesCount = store(state => state.setSlidesCount)
  const setStepsForSlide = store(state => state.setStepsForSlide)
  const reset = store(state => state.reset)

  const atStart = currentSlide === 0 && currentStep === 0
  const finalSlideIndex = slides.length - 1
  const finalStep = slideSteps[finalSlideIndex] ?? 0
  const atEnd = currentSlide === finalSlideIndex && currentStep === finalStep

  const labels: A11yLabels = useMemo(
    () => ({
      deck: 'Presentation deck',
      next: 'Next slide',
      prev: 'Previous slide',
      pause: 'Pause autoplay',
      play: 'Play autoplay',
      slide: (index, total) => `Slide ${index} of ${total}`,
      ...(a11y ?? {})
    }),
    [a11y]
  )

  const [currentVNode, setCurrentVNode] = useState(slides[0] as VNode)
  const [prevVNode, setPrevVNode] = useState<VNode | null>(null)
  const [paused, setPaused] = useState(
    autoAdvancePaused || autoAdvanceMs == null
  )
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const slideRef = useRef<HTMLDivElement>(null)
  const reduceMotion = prefersReducedMotion()
  const firstRenderRef = useRef(true)

  useLayoutEffect(() => {
    slideSteps.forEach((count, index) => setStepsForSlide(index, count))
  }, [slideSteps, setStepsForSlide])

  /**
   * Type guard to determine whether props include a transition configuration.
   *
   * @param props - Props to test.
   * @returns True if the props contain a transition.
   */
  const hasTransition = (
    props: unknown
  ): props is { transition?: SlideTransition } =>
    typeof props === 'object' && props !== null && 'transition' in props

  /**
   * Retrieves the transition configuration for a slide and mode.
   *
   * @param slide - Slide vnode.
   * @param mode - Whether the slide is entering or exiting.
   * @returns Transition configuration.
   */
  const getTransition = (slide: VNode, mode: 'enter' | 'exit'): Transition => {
    const t = hasTransition(slide?.props) ? slide?.props?.transition : undefined
    if (!t) return defaultTransition
    if ('type' in t) return t
    return t[mode] ?? defaultTransition
  }

  useLayoutEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false
      return
    }
    const nextVNode = slides[currentSlide] as VNode
    setPrevVNode(currentVNode)
    setCurrentVNode(nextVNode)
  }, [currentSlide, slides])

  useLayoutEffect(() => {
    const container = slideRef.current
    if (!container) return
    const currentEl = container.lastElementChild as HTMLElement | null
    const prevEl = currentEl?.previousElementSibling as HTMLElement | null
    if (
      currentEl &&
      !(reduceMotion || getTransition(currentVNode, 'enter').type === 'none')
    ) {
      runAnimation(currentEl, getTransition(currentVNode, 'enter'), 'in')
    }
    if (prevVNode && prevEl) {
      if (reduceMotion || getTransition(prevVNode, 'exit').type === 'none') {
        setPrevVNode(null)
      } else {
        const anim = runAnimation(
          prevEl,
          getTransition(prevVNode, 'exit'),
          'out'
        )
        anim.finished.then(() => setPrevVNode(null))
      }
    }
  }, [currentVNode, prevVNode, reduceMotion])

  useEffect(() => {
    setSlidesCount(slides.length)
    if (typeof initialSlide === 'number') {
      goTo(initialSlide, 0)
    }
  }, [slides.length, setSlidesCount, initialSlide, goTo])

  /**
   * Clears any pending autoplay timer.
   */
  const clearAutoAdvance = (): void => {
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  /**
   * Schedules the next autoplay advance if enabled.
   */
  const scheduleAutoAdvance = (): void => {
    clearAutoAdvance()
    if (!paused) {
      const delay = autoAdvanceMs ?? DEFAULT_AUTO_ADVANCE_MS
      timeoutRef.current = setTimeout(() => {
        next()
        scheduleAutoAdvance()
      }, delay)
    }
  }

  useEffect(() => {
    scheduleAutoAdvance()
    return clearAutoAdvance
  }, [autoAdvanceMs, paused, next])

  /**
   * Pauses autoplay once the final slide is reached.
   */
  useEffect(() => {
    if (atEnd && !paused) {
      setPaused(true)
      clearAutoAdvance()
    }
  }, [atEnd, paused])

  /**
   * Toggles autoplay between paused and playing states.
   */
  const toggleAutoplay = (): void => {
    setPaused(p => {
      const nextPaused = !p
      if (nextPaused) {
        clearAutoAdvance()
      } else {
        scheduleAutoAdvance()
      }
      return nextPaused
    })
  }

  /**
   * Resets autoplay timing after manual navigation.
   */
  const resetAutoAdvance = (): void => {
    scheduleAutoAdvance()
  }

  /**
   * Advances to the next step or slide.
   */
  const handleNext = (): void => {
    next()
    resetAutoAdvance()
  }

  /**
   * Moves backward to the previous step or slide.
   */
  const handlePrev = (): void => {
    prev()
    resetAutoAdvance()
  }

  /**
   * Jumps to a specific slide and step.
   *
   * @param slide - Target slide index.
   * @param step - Target step index.
   */
  const handleGoTo = (slide: number, step: number): void => {
    goTo(slide, step)
    resetAutoAdvance()
  }

  const { ref: hostRef, scale } = useScale(size)
  const themeStyle = useMemo(() => {
    const style: JSX.CSSProperties = {}
    if (theme) {
      for (const [k, v] of Object.entries(theme)) {
        ;(style as any)[k] = String(v)
      }
    }
    return style
  }, [theme])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase()
      const typing =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        (e.target as HTMLElement)?.isContentEditable
      if (typing) return

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ': {
          e.preventDefault()
          handleNext()
          break
        }
        case 'ArrowLeft':
        case 'PageUp':
        case 'Backspace': {
          e.preventDefault()
          handlePrev()
          break
        }
        case 'Home': {
          e.preventDefault()
          handleGoTo(0, 0)
          break
        }
        case 'End': {
          e.preventDefault()
          handleGoTo(slides.length - 1, 0)
          break
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, goTo, slides.length])

  useEffect(() => {
    return () => {
      reset()
    }
  }, [reset])

  // TODO(campfire): A11y: consider roving tabindex for focusable controls,
  // visible focus indicators, and ARIA live regions for autoplay state.
  // Add tests to verify keyboard-only navigation and reduced-motion paths.
  return (
    <div
      ref={hostRef}
      className={mergeClasses(
        'campfire-deck relative w-full h-full overflow-hidden',
        className
      )}
      style={{
        background:
          'var(--deck-bg,linear-gradient(to bottom,var(--color-gray-900),var(--color-gray-950)))',
        ...themeStyle
      }}
      role='region'
      aria-roledescription='deck'
      aria-label={labels.deck}
      tabIndex={0}
      data-testid='deck'
    >
      <div
        ref={slideRef}
        className={mergeClasses(
          'campfire-deck-group absolute left-1/2 top-1/2 origin-center rounded-2xl overflow-hidden shadow-[0_10px_30px_oklch(0_0_0_/_0.35)] bg-[var(--slide-bg,var(--color-gray-50))] text-[var(--slide-fg,var(--color-gray-950))]',
          groupClassName
        )}
        style={{
          width: size.width,
          height: size.height,
          transform: `translate(-50%, -50%) scale(${scale})`
        }}
        role='group'
        aria-roledescription='slide'
        aria-label={labels.slide(currentSlide + 1, slides.length)}
        data-testid='deck-group'
      >
        {prevVNode}
        {currentVNode}
      </div>
      <div aria-live='polite' aria-atomic='true' style={srOnlyStyle}>
        {labels.slide(currentSlide + 1, slides.length)}
      </div>
      {showSlideCount && (
        <div
          className={mergeClasses(
            'campfire-deck-hud absolute top-3 right-3 text-sm px-2 py-1 rounded bg-black/50 text-white/80 text-right',
            hudClassName
          )}
          aria-hidden='true'
          data-testid='deck-hud'
        >
          <div
            className={mergeClasses(
              'campfire-deck-slide-hud',
              slideHudClassName
            )}
            data-testid='deck-slide-hud'
          >
            Slide {currentSlide + 1} / {slides.length}
          </div>
        </div>
      )}
      {!hideNavigation && (
        <div
          className={mergeClasses(
            'campfire-deck-nav absolute inset-x-0 bottom-2 flex items-center justify-center px-2 pointer-events-none gap-[8px]',
            navClassName
          )}
          data-testid='deck-nav'
        >
          <button
            type='button'
            className={mergeClasses(
              'campfire-deck-prev campfire-deck-nav-button pointer-events-auto px-3 py-1 rounded bg-black/60 text-white/90 focus:outline-none focus:ring disabled:opacity-50',
              navButtonClassName,
              rewindButtonClassName
            )}
            aria-label={labels.prev}
            onClick={e => {
              e.stopPropagation()
              handlePrev()
            }}
            data-testid='deck-prev'
            disabled={atStart}
          >
            ⏮
          </button>
          <button
            type='button'
            className={mergeClasses(
              'campfire-deck-autoplay-toggle campfire-deck-nav-button pointer-events-auto px-3 py-1 rounded bg-black/60 text-white/90 focus:outline-none focus:ring disabled:opacity-50',
              navButtonClassName,
              playButtonClassName
            )}
            aria-label={paused ? labels.play : labels.pause}
            onClick={e => {
              e.stopPropagation()
              toggleAutoplay()
            }}
            data-testid='deck-autoplay-toggle'
            data-state={paused ? 'paused' : 'playing'}
          >
            {paused ? '▶' : '⏸'}
          </button>
          <button
            type='button'
            className={mergeClasses(
              'campfire-deck-next campfire-deck-nav-button pointer-events-auto px-3 py-1 rounded bg-black/60 text-white/90 focus:outline-none focus:ring disabled:opacity-50',
              navButtonClassName,
              fastForwardButtonClassName
            )}
            aria-label={labels.next}
            onClick={e => {
              e.stopPropagation()
              handleNext()
            }}
            data-testid='deck-next'
            disabled={atEnd}
          >
            ⏭
          </button>
        </div>
      )}
    </div>
  )
}

export default Deck
