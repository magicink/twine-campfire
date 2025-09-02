import { type ComponentChildren, type JSX } from 'preact'
import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'preact/hooks'
import { useDeckStore } from '@campfire/state/useDeckStore'
import type { Transition } from '../types'
import { SlideTransitionContext } from '../context'
import {
  defaultTransition,
  prefersReducedMotion,
  runAnimation
} from '@campfire/components/transition'

export interface SlideRevealProps {
  at?: number
  exitAt?: number
  enter?: Transition
  exit?: Transition
  interruptBehavior?: 'jumpToEnd' | 'cancel'
  /** Additional CSS class names for the reveal element. */
  className?: string
  /** Additional CSS properties for the reveal element. */
  style?: JSX.CSSProperties | string
  children: ComponentChildren
  /** Optional custom deck store. */
  store?: typeof useDeckStore
}

/**
 * Gradually reveals or hides content based on the current deck step.
 *
 * @param props - Configuration options for the SlideReveal component.
 * @returns The rendered element when present.
 */
export const SlideReveal = ({
  at = 0,
  exitAt,
  enter,
  exit,
  interruptBehavior = 'jumpToEnd',
  className,
  style,
  children,
  store = useDeckStore
}: SlideRevealProps): JSX.Element | null => {
  const currentStep = store(state => state.currentStep)
  const currentSlide = store(state => state.currentSlide)
  const slideTransition = useContext(SlideTransitionContext)
  const [present, setPresent] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const animationRef = useRef<Animation | null>(null)
  const skipNextAnimationRef = useRef(false)
  const reduceMotion = prefersReducedMotion()
  const visible =
    currentStep >= at && (exitAt === undefined || currentStep < exitAt)

  const prevStepRef = useRef(currentStep)
  const prevSlideRef = useRef(currentSlide)
  const slideChanged = prevSlideRef.current !== currentSlide
  const stepJumped =
    !slideChanged && Math.abs(prevStepRef.current - currentStep) > 1
  useEffect(() => {
    prevStepRef.current = currentStep
    prevSlideRef.current = currentSlide
  }, [currentStep, currentSlide])

  useLayoutEffect(() => {
    const el = ref.current
    const enterT = enter ?? slideTransition.enter ?? defaultTransition
    const exitT =
      exit ?? slideTransition.exit ?? slideTransition.enter ?? defaultTransition

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

    if (slideChanged) {
      if (present) {
        if (!reduceMotion && el) {
          const anim = runAnimation(el, exitT, 'out')
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
    }

    if (stepJumped || reduceMotion) {
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
        animationRef.current = runAnimation(el, enterT, 'in')
      }
    } else if (present) {
      if (el) {
        const anim = runAnimation(el, exitT, 'out')
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
    slideTransition,
    interruptBehavior,
    slideChanged,
    stepJumped,
    reduceMotion
  ])

  if (!present) return null
  return (
    <div
      ref={ref}
      className={['campfire-slide-reveal', !visible && 'hidden', className]
        .filter(Boolean)
        .join(' ')}
      style={style}
      data-testid='slide-reveal'
    >
      {children}
    </div>
  )
}

export default SlideReveal
