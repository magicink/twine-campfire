import {
  cloneElement,
  isValidElement,
  toChildArray,
  type ComponentChildren,
  type VNode
} from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import {
  OnComplete,
  type OnCompleteProps
} from '@campfire/components/Passage/OnComplete'
import {
  Step,
  type StepProps
} from '@campfire/components/Passage/Sequence/Step'
import {
  Transition,
  DEFAULT_TRANSITION_DURATION,
  type TransitionProps
} from '@campfire/components/Passage/Sequence/Transition'

interface SequenceProps {
  /** Collection of Step elements */
  children: ComponentChildren
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
  /** Accessible label for the manual continue button */
  continueAriaLabel?: string
  /** Accessible label for the fast-forward skip button */
  skipAriaLabel?: string
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
  continueLabel = 'Continue',
  skipLabel = 'Skip',
  continueAriaLabel = 'Continue to next step',
  skipAriaLabel
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

  /**
   * Recursively determines the longest transition duration within a step.
   */
  const getMaxDuration = (children: ComponentChildren): number => {
    let max = 0
    const walk = (nodes: ComponentChildren) => {
      for (const child of toChildArray(nodes)) {
        if (!isValidElement(child)) continue
        if (child.type === Transition) {
          const props = child.props as TransitionProps
          const duration = props.duration ?? DEFAULT_TRANSITION_DURATION
          const delay = props.delay ?? 0
          const total = delay + duration
          if (total > max) max = total
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
      const transitionDelay = getMaxDuration(current.props.children || [])
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
  const showSkip = fastForwardEnabled && index < steps.length - 1
  const skipAria =
    skipAriaLabel ?? (fastForward?.toEnd ? 'Skip to end' : 'Skip to next step')

  return (
    <>
      {cloneElement(current, {
        next: handleNext,
        fastForward: handleFastForward
      })}
      {completeElement && cloneElement(completeElement, { run: runComplete })}
      {showContinue && (
        <button
          type='button'
          className='font-cormorant'
          onClick={handleNext}
          aria-label={continueAriaLabel}
        >
          {continueLabel}
        </button>
      )}
      {showSkip && (
        <button
          type='button'
          className='font-cormorant'
          onClick={handleFastForward}
          aria-label={skipAria}
        >
          {skipLabel}
        </button>
      )}
    </>
  )
}

export { type SequenceProps, type FastForwardOptions }
