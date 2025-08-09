import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode
} from 'react'

interface StepProps {
  /** Content or render function for the step */
  children:
    | ReactNode
    | ((controls: { next: () => void; fastForward: () => void }) => ReactNode)
  /** Callback to advance to the next step. Supplied by Sequence. */
  next?: () => void
  /** Callback to fast-forward the sequence. Supplied by Sequence. */
  fastForward?: () => void
}

/**
 * Represents a single step within a {@link Sequence}.
 * The content can be static React nodes or a render function
 * receiving `next` and `fastForward` callbacks to control progression.
 * Cannot contain a {@link Sequence} as a child.
 */
export const Step = ({ children, next, fastForward }: StepProps) => {
  if (
    typeof children !== 'function' &&
    Children.toArray(children).some(
      child => isValidElement(child) && child.type === Sequence
    )
  ) {
    throw new Error('Step cannot be the parent of a Sequence')
  }
  if (typeof children === 'function') {
    return (
      <>
        {(
          children as (controls: {
            next: () => void
            fastForward: () => void
          }) => ReactNode
        )({
          next: next ?? (() => {}),
          fastForward: fastForward ?? (() => {})
        })}
      </>
    )
  }
  return <>{children}</>
}

interface TransitionProps {
  /** Type of transition animation */
  type?: 'fade-in'
  /** Duration of the transition in milliseconds */
  duration?: number
  /** Content to render with the transition */
  children: ReactNode
}

/**
 * Animates its children using a simple CSS-based transition.
 */
export const Transition = ({
  type = 'fade-in',
  duration = 300,
  children
}: TransitionProps) => {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])
  const style: CSSProperties =
    type === 'fade-in'
      ? {
          transition: `opacity ${duration}ms ease-in`,
          opacity: visible ? 1 : 0
        }
      : {}
  return <div style={style}>{children}</div>
}

interface SequenceProps {
  /** Collection of Step elements */
  children: ReactNode
  /** Automatically advance through steps without user interaction */
  autoplay?: boolean
  /** Delay in milliseconds between automatic steps. Only used when autoplay is true */
  delay?: number
  /** Configuration for fast-forward behavior */
  fastForward?: FastForwardOptions
  /** Text for the manual continue button */
  continueLabel?: string
  /** Text for the fast-forward skip button */
  skipLabel?: string
}

/** Options for configuring fast-forward behavior */
interface FastForwardOptions {
  /** Whether fast-forwarding is enabled */
  enabled?: boolean
  /** Whether to skip to the end of the sequence when fast-forwarding */
  toEnd?: boolean
}

/**
 * Renders `Step` children sequentially, displaying only the active step.
 * Each step receives a `next` callback to advance to the following step.
 * If `autoplay` is true, steps advance automatically after an optional `delay`.
 * Otherwise a "Continue" button is shown for non-interactive steps.
 * A `fastForward` control is provided to skip steps or jump to the end
 * based on the supplied `fastForward` options. Both button labels may be
 * customized via `continueLabel` and `skipLabel` props.
 */
export const Sequence = ({
  children,
  autoplay = false,
  delay = 0,
  fastForward,
  continueLabel = 'Continue',
  skipLabel = 'Skip'
}: SequenceProps) => {
  const [index, setIndex] = useState(0)
  const steps = Children.toArray(children).filter(
    (child): child is ReactElement<StepProps> =>
      isValidElement(child) && child.type === Step
  )
  const current = steps[index]
  /**
   * Advances to the next step in the sequence.
   */
  const handleNext = () => setIndex(i => Math.min(i + 1, steps.length - 1))
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

  useEffect(() => {
    if (autoplay && index < steps.length - 1) {
      const id = setTimeout(handleNext, delay)
      return () => clearTimeout(id)
    }
  }, [autoplay, delay, index, steps.length])

  if (!current) return null

  const isInteractive = typeof current.props.children === 'function'
  const showContinue = !autoplay && !isInteractive && index < steps.length - 1
  const fastForwardEnabled = fastForward?.enabled !== false
  const showSkip = fastForwardEnabled && index < steps.length - 1

  return (
    <>
      {cloneElement(current, {
        next: handleNext,
        fastForward: handleFastForward
      })}
      {showContinue && (
        <button type='button' onClick={handleNext}>
          {continueLabel}
        </button>
      )}
      {showSkip && (
        <button type='button' onClick={handleFastForward}>
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
  type TransitionProps
}
