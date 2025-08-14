import { type ComponentChildren, type JSX } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { useDeckStore } from '@/packages/use-deck-store'
import {
  type Transition,
  type Direction
} from '@campfire/components/Slide/Slide'

export interface AppearProps {
  at?: number
  exitAt?: number
  enter?: Transition
  exit?: Transition
  interruptBehavior?: 'jumpToEnd' | 'cancel'
  children: ComponentChildren
}

const defaultTransition: Transition = { type: 'fade', duration: 300 }

/**
 * Returns whether the user prefers reduced motion.
 *
 * @returns True if reduced motion is preferred.
 */
const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

/**
 * Builds keyframes for the given transition and mode.
 *
 * @param transition - Transition configuration.
 * @param mode - Whether the animation is entering or exiting.
 * @returns A sequence of keyframes.
 */
const buildKeyframes = (
  transition: Transition,
  mode: 'in' | 'out'
): Keyframe[] => {
  switch (transition.type) {
    case 'fade':
      return mode === 'in'
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [{ opacity: 1 }, { opacity: 0 }]
    case 'slide': {
      const offset = 40
      const dir: Direction = transition.dir ?? 'up'
      let axis: 'X' | 'Y' = 'Y'
      let from = -offset
      if (dir === 'left') {
        axis = 'X'
        from = -offset
      } else if (dir === 'right') {
        axis = 'X'
        from = offset
      } else if (dir === 'down') {
        axis = 'Y'
        from = offset
      }
      const start = `translate${axis}(${from}px)`
      const end = `translate${axis}(0px)`
      return mode === 'in'
        ? [
            { transform: start, opacity: 0 },
            { transform: end, opacity: 1 }
          ]
        : [
            { transform: end, opacity: 1 },
            { transform: start, opacity: 0 }
          ]
    }
    case 'zoom':
      return mode === 'in'
        ? [
            { transform: 'scale(0.95)', opacity: 0 },
            { transform: 'scale(1)', opacity: 1 }
          ]
        : [
            { transform: 'scale(1)', opacity: 1 },
            { transform: 'scale(0.95)', opacity: 0 }
          ]
    default:
      return []
  }
}

/**
 * Runs a WAAPI animation for the provided element and transition.
 *
 * @param el - Target element.
 * @param transition - Transition configuration.
 * @param mode - Whether this is an enter or exit animation.
 * @returns The created animation instance.
 */
const runAnimation = (
  el: HTMLElement,
  transition: Transition,
  mode: 'in' | 'out'
): Animation =>
  el.animate(buildKeyframes(transition, mode), {
    duration: transition.duration ?? 300,
    easing: transition.easing ?? 'ease',
    delay: transition.delay ?? 0,
    fill: 'forwards'
  })

/**
 * Gradually reveals or hides content based on the current deck step.
 *
 * @param props - Configuration options for the appear component.
 * @returns The rendered element when present.
 */
export const Appear = ({
  at = 0,
  exitAt,
  enter,
  exit,
  interruptBehavior = 'jumpToEnd',
  children
}: AppearProps): JSX.Element | null => {
  const { currentStep, currentSlide, maxSteps, setMaxSteps } = useDeckStore()
  const [present, setPresent] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const animationRef = useRef<Animation | null>(null)
  const skipNextAnimationRef = useRef(false)
  const reduceMotion = prefersReducedMotion()
  const visible =
    currentStep >= at && (exitAt === undefined || currentStep < exitAt)

  const prevStepRef = useRef(currentStep)
  const prevSlideRef = useRef(currentSlide)
  const jumped =
    prevSlideRef.current !== currentSlide ||
    Math.abs(prevStepRef.current - currentStep) > 1
  useEffect(() => {
    prevStepRef.current = currentStep
    prevSlideRef.current = currentSlide
  }, [currentStep, currentSlide])

  useEffect(() => {
    const candidate = Math.max(at, exitAt ?? at)
    if (candidate > maxSteps) {
      setMaxSteps(candidate)
    }
  }, [at, exitAt, maxSteps, setMaxSteps])

  useEffect(() => {
    const el = ref.current
    const interrupt = () => {
      if (animationRef.current) {
        if (interruptBehavior === 'jumpToEnd') {
          animationRef.current.finish()
        } else {
          animationRef.current.cancel()
        }
        animationRef.current = null
      }
    }

    interrupt()

    if (jumped || reduceMotion) {
      if (visible) {
        if (!present) {
          setPresent(true)
          skipNextAnimationRef.current = true
        }
      } else if (present) {
        setPresent(false)
      }
      return () => {
        if (animationRef.current) {
          if (interruptBehavior === 'jumpToEnd') {
            animationRef.current.finish()
          } else {
            animationRef.current.cancel()
          }
          animationRef.current = null
        }
      }
    }

    if (skipNextAnimationRef.current) {
      skipNextAnimationRef.current = false
      return () => {
        if (animationRef.current) {
          if (interruptBehavior === 'jumpToEnd') {
            animationRef.current.finish()
          } else {
            animationRef.current.cancel()
          }
          animationRef.current = null
        }
      }
    }

    if (visible) {
      if (!present) {
        setPresent(true)
        return () => {
          animationRef.current?.cancel()
        }
      }
      if (el) {
        animationRef.current = runAnimation(
          el,
          enter ?? defaultTransition,
          'in'
        )
      }
    } else if (present) {
      if (el) {
        const anim = runAnimation(el, exit ?? defaultTransition, 'out')
        animationRef.current = anim
        anim.finished.then(() => {
          if (animationRef.current === anim) {
            setPresent(false)
            animationRef.current = null
          }
        })
      } else {
        setPresent(false)
      }
    }

    return () => {
      if (animationRef.current) {
        if (interruptBehavior === 'jumpToEnd') {
          animationRef.current.finish()
        } else {
          animationRef.current.cancel()
        }
        animationRef.current = null
      }
    }
  }, [
    at,
    exitAt,
    visible,
    present,
    enter,
    exit,
    interruptBehavior,
    jumped,
    reduceMotion
  ])

  if (!present) return null
  return (
    <div ref={ref} style={{ display: visible ? '' : 'none' }}>
      {children}
    </div>
  )
}
