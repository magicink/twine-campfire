import {
  type Transition,
  type Direction
} from '@campfire/components/Deck/Slide'

/**
 * Returns whether the user prefers reduced motion.
 *
 * @returns True if reduced motion is preferred.
 */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

/**
 * Default transition used when none is provided.
 */
export const defaultTransition: Transition = { type: 'fade', duration: 300 }

/**
 * Builds keyframes for the given transition and mode.
 *
 * @param transition - Transition configuration.
 * @param mode - Whether the animation is entering or exiting.
 * @returns A sequence of keyframes.
 */
export const buildKeyframes = (
  transition: Transition,
  mode: 'in' | 'out'
): Keyframe[] => {
  switch (transition.type) {
    case 'none':
      return []
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
export const runAnimation = (
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
