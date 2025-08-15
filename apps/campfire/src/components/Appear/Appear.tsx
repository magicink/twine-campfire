import { type ComponentChildren, type JSX } from 'preact'
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks'
import { useDeckStore } from '@campfire/use-deck-store'
import { type Transition } from '@campfire/components/Slide/Slide'
import {
  defaultTransition,
  prefersReducedMotion,
  runAnimation
} from '@campfire/components/transition'

export interface AppearProps {
  at?: number
  exitAt?: number
  enter?: Transition
  exit?: Transition
  interruptBehavior?: 'jumpToEnd' | 'cancel'
  children: ComponentChildren
}

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
  const currentStep = useDeckStore(state => state.currentStep)
  const currentSlide = useDeckStore(state => state.currentSlide)
  const maxSteps = useDeckStore(state => state.maxSteps)
  const setMaxSteps = useDeckStore(state => state.setMaxSteps)
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
    Math.abs(prevSlideRef.current - currentSlide) > 1 ||
    (prevSlideRef.current === currentSlide &&
      Math.abs(prevStepRef.current - currentStep) > 1)
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

  useLayoutEffect(() => {
    const el = ref.current

    /**
     * Stops and clears the current animation based on the interrupt policy.
     */
    const clearAnimation = (): void => {
      if (animationRef.current) {
        if (interruptBehavior === 'jumpToEnd') {
          animationRef.current.finish()
        } else {
          animationRef.current.cancel()
        }
        animationRef.current = null
      }
    }

    clearAnimation()

    if (jumped || reduceMotion) {
      if (visible) {
        if (!present) {
          setPresent(true)
          skipNextAnimationRef.current = true
        }
      } else if (present) {
        setPresent(false)
      }
      return clearAnimation
    }

    if (skipNextAnimationRef.current) {
      skipNextAnimationRef.current = false
      return clearAnimation
    }

    if (visible) {
      if (!present) {
        setPresent(true)
        return clearAnimation
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

    return clearAnimation
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
