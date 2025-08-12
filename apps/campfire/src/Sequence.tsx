import {
  cloneElement,
  isValidElement,
  toChildArray,
  type ComponentChildren,
  type VNode,
  type JSX
} from 'preact'
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks'
import { OnComplete, type OnCompleteProps } from './OnComplete'

interface StepProps {
  /** Content or render function for the step */
  children:
    | ComponentChildren
    | ((controls: {
        next: () => void
        fastForward: () => void
        rewind: () => void
      }) => ComponentChildren)
  /** Callback to advance to the next step. Supplied by Sequence. */
  next?: () => void
  /** Callback to fast-forward the sequence. Supplied by Sequence. */
  fastForward?: () => void
  /** Callback to rewind the sequence. Supplied by Sequence. */
  rewind?: () => void
  /** Delay in milliseconds between transition children */
  stagger?: number
}

/**
 * Represents a single step within a {@link Sequence}.
 * The content can be static React nodes or a render function
 * receiving `next` and `fastForward` callbacks to control progression.
 */
export const Step = ({
  children,
  next,
  fastForward,
  rewind,
  stagger = 0
}: StepProps) => {
  const content =
    typeof children === 'function'
      ? (
          children as (controls: {
            next: () => void
            fastForward: () => void
            rewind: () => void
          }) => ComponentChildren
        )({
          next: next ?? (() => {}),
          fastForward: fastForward ?? (() => {}),
          rewind: rewind ?? (() => {})
        })
      : children

  let offset = 0
  const mapChildren = (nodes: ComponentChildren): ComponentChildren =>
    toChildArray(nodes).map(child => {
      if (!isValidElement(child)) return child
      if (child.type === Transition) {
        const props = child.props as TransitionProps
        const delay = (props.delay ?? 0) + offset
        offset += stagger
        return cloneElement(child as VNode<TransitionProps>, { delay })
      }
      if (child.props?.children) {
        return cloneElement(child as VNode, {
          children: mapChildren(child.props.children)
        })
      }
      return child
    })

  return <>{mapChildren(content)}</>
}

interface TransitionProps {
  /** Type of transition animation */
  type?: 'fade-in'
  /** Duration of the transition in milliseconds */
  duration?: number
  /** Delay before starting the transition in milliseconds */
  delay?: number
  /** Content to render with the transition */
  children: ComponentChildren
}

/** Default duration used when a transition does not specify one. */
const DEFAULT_TRANSITION_DURATION = 300

/**
 * Animates its children using a simple CSS-based transition.
 */
export const Transition = ({
  type = 'fade-in',
  duration = DEFAULT_TRANSITION_DURATION,
  delay = 0,
  children
}: TransitionProps) => {
  const [visible, setVisible] = useState(false)
  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])
  const style: JSX.CSSProperties =
    type === 'fade-in'
      ? {
          transition: `opacity ${duration}ms ease-in`,
          transitionDelay: `${delay}ms`,
          opacity: visible ? 1 : 0
        }
      : {}
  return (
    <div style={style} role='presentation'>
      {children}
    </div>
  )
}

interface SequenceProps {
  /** Collection of Step elements */
  children: ComponentChildren
  /** Automatically advance through steps without user interaction */
  autoplay?: boolean
  /** Delay in milliseconds between automatic steps. Only used when autoplay is true */
  delay?: number
  /** Configuration for fast-forward behavior */
  fastForward?: FastForwardOptions
  /** Configuration for rewind behavior */
  rewind?: RewindOptions
  /** Text for the manual continue button */
  continueLabel?: string
  /** Text for the fast-forward skip button */
  skipLabel?: string
  /** Text for the rewind button */
  rewindLabel?: string
  /** Accessible label for the manual continue button */
  continueAriaLabel?: string
  /** Accessible label for the fast-forward skip button */
  skipAriaLabel?: string
  /** Accessible label for the rewind button */
  rewindAriaLabel?: string
}

/** Options for configuring fast-forward behavior */
interface FastForwardOptions {
  /** Whether fast-forwarding is enabled */
  enabled?: boolean
  /** Whether to skip to the end of the sequence when fast-forwarding */
  toEnd?: boolean
}

/** Options for configuring rewind behavior */
interface RewindOptions {
  /** Whether rewinding is enabled */
  enabled?: boolean
  /** Whether to jump to the start of the sequence when rewinding */
  toStart?: boolean
}

/**
 * Renders `Step` children sequentially, displaying only the active step.
 * Each step receives a `next` callback to advance to the following step.
 * If `autoplay` is true, steps advance automatically after an optional `delay`.
 * Otherwise a "Continue" button is shown for non-interactive steps.
 * A `fastForward` control is provided to skip steps or jump to the end
 * based on the supplied `fastForward` options. Button text and accessible
 * labels may be customized via `continueLabel`, `skipLabel`,
 * `continueAriaLabel`, and `skipAriaLabel` props.
 * Accepts at most one `OnComplete` child; if multiple are provided only the
 * first will run and a warning is logged.
 */
export const Sequence = ({
  children,
  autoplay = false,
  delay = 0,
  fastForward,
  rewind,
  continueLabel = 'Continue',
  skipLabel = 'Skip',
  rewindLabel = 'Back',
  continueAriaLabel = 'Continue to next step',
  skipAriaLabel,
  rewindAriaLabel
}: SequenceProps) => {
  const [index, setIndex] = useState(0)
  const childArray = toChildArray(children).filter((child): child is VNode =>
    isValidElement(child)
  )
  const completeElements = childArray.filter(
    child => child.type === OnComplete
  ) as VNode<OnCompleteProps>[]
  if (completeElements.length > 1) {
    console.warn(
      'Sequence accepts only one <OnComplete> component; additional instances will be ignored.'
    )
  }
  const completeElement = completeElements[0]
  const steps = childArray.filter(
    child => child.type === Step
  ) as VNode<StepProps>[]
  const current = steps[index]
  useEffect(() => {
    setIndex(0)
  }, [steps.length])
  /**
   * Advances to the next step in the sequence.
   */
  const handleNext = () => setIndex(i => (i < steps.length - 1 ? i + 1 : i))
  /** Fast-forwards either to the next step or the end of the sequence */
  const handleFastForward = () => {
    const { enabled = true, toEnd = false } = fastForward ?? {}
    if (!enabled) return
    if (toEnd) {
      setIndex(steps.length - 1)
    } else {
      handleNext()
    }
  }

  /** Rewinds either to the previous step or the start of the sequence */
  const handleRewind = () => {
    const { enabled = false, toStart = false } = rewind ?? {}
    if (!enabled) return
    if (toStart) {
      setIndex(0)
    } else {
      setIndex(i => (i > 0 ? i - 1 : i))
    }
  }

  /**
   * Recursively determines the longest transition duration within a step.
   */
  const getMaxDuration = (children: ComponentChildren, stagger = 0): number => {
    let max = 0
    let offset = 0
    const walk = (nodes: ComponentChildren) => {
      for (const child of toChildArray(nodes)) {
        if (!isValidElement(child)) continue
        if (child.type === Transition) {
          const props = child.props as TransitionProps
          const duration = props.duration ?? DEFAULT_TRANSITION_DURATION
          const delay = (props.delay ?? 0) + offset
          const total = delay + duration
          if (total > max) max = total
          offset += stagger
        }
        if (child.props?.children) {
          walk(child.props.children)
        }
      }
    }
    walk(children)
    return max
  }

  useEffect(() => {
    if (autoplay && index < steps.length - 1 && current) {
      const transitionDelay = getMaxDuration(
        current.props.children || [],
        current.props.stagger ?? 0
      )
      const id = setTimeout(handleNext, delay + transitionDelay)
      return () => clearTimeout(id)
    }
  }, [autoplay, delay, index, steps.length, current])

  /** Tracks whether the completion handler has already executed. */
  const completeRan = useRef(false)

  useEffect(() => {
    completeRan.current = false
  }, [steps.length])

  if (!current) return null

  const runComplete = index === steps.length - 1 && !completeRan.current
  if (runComplete) {
    completeRan.current = true
  }

  const isInteractive = typeof current.props.children === 'function'
  const showContinue = !autoplay && !isInteractive && index < steps.length - 1
  const fastForwardEnabled = fastForward?.enabled !== false
  const rewindEnabled = rewind?.enabled === true
  const showSkip = fastForwardEnabled && index < steps.length - 1
  const showRewind = rewindEnabled && index > 0
  const skipAria =
    skipAriaLabel ?? (fastForward?.toEnd ? 'Skip to end' : 'Skip to next step')
  const rewindAria =
    rewindAriaLabel ??
    (rewind?.toStart ? 'Rewind to start' : 'Rewind to previous step')

  return (
    <>
      {cloneElement(current, {
        next: handleNext,
        fastForward: handleFastForward,
        rewind: handleRewind
      })}
      {completeElement && cloneElement(completeElement, { run: runComplete })}
      {showRewind && (
        <button type='button' onClick={handleRewind} aria-label={rewindAria}>
          {rewindLabel}
        </button>
      )}
      {showContinue && (
        <button
          type='button'
          onClick={handleNext}
          aria-label={continueAriaLabel}
        >
          {continueLabel}
        </button>
      )}
      {showSkip && (
        <button type='button' onClick={handleFastForward} aria-label={skipAria}>
          {skipLabel}
        </button>
      )}
    </>
  )
}

export {
  type SequenceProps,
  type StepProps,
  type FastForwardOptions,
  type RewindOptions,
  type TransitionProps
}
