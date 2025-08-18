import {
  toChildArray,
  type ComponentChildren,
  type JSX,
  type VNode
} from 'preact'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'preact/hooks'
import { useDeckStore } from '@campfire/state/useDeckStore'
import { useSerializedDirectiveRunner } from '@campfire/hooks/useSerializedDirectiveRunner'
import { Appear } from './Appear'
import { SlideTransitionContext } from './context'

/** Transition type used by slides. */
export type TransitionType = 'none' | 'fade' | 'slide' | 'zoom'
/** Direction for slide transitions. */
export type Direction = 'left' | 'right' | 'up' | 'down'

/**
 * Describes a single transition configuration.
 */
export interface Transition {
  type: TransitionType
  dir?: Direction
  duration?: number
  delay?: number
  easing?: string
}

/**
 * Allows specifying separate enter and exit transitions.
 */
export type SlideTransition =
  | Transition
  | { enter?: Transition; exit?: Transition }

/** Properties accepted by the {@link Slide} component. */
export interface SlideProps {
  /** Optional build steps on this slide (used by the Deck store when active). */
  steps?: number
  /**
   * Transition metadata consumed by Deck’s WAAPI wrapper and exposed via the
   * `data-transition` attribute.
   */
  transition?: SlideTransition
  className?: string
  /** Serialized directive block to run when the slide becomes active. */
  onEnter?: string
  /** Serialized directive block to run when the slide unmounts. */
  onExit?: string
  children?: ComponentChildren
}

/**
 * Recursively scans the Slide's descendants to determine the highest step
 * index contributed by any {@link Appear} component. The traversal flattens
 * fragments via {@link toChildArray} so nested arrays and fragments are
 * inspected. When an `Appear` is encountered, both its `at` and `exitAt`
 * values are considered to account for entry and exit steps.
 *
 * @param children - Potentially nested Slide children to inspect.
 * @returns The maximum step index discovered across all Appear elements.
 */
const getAppearMax = (children: ComponentChildren): number => {
  let max = 0
  const walk = (nodes: ComponentChildren): void => {
    toChildArray(nodes).forEach(node => {
      if (typeof node === 'object' && node !== null && 'type' in node) {
        const child = node as VNode<any>
        if (child.type === Appear) {
          const at = child.props.at ?? 0
          const exitAt = child.props.exitAt ?? at
          max = Math.max(max, Math.max(at, exitAt))
        }
        if (child.props?.children) {
          walk(child.props.children)
        }
      }
    })
  }
  walk(children)
  return max
}

/**
 * Renders a presentation slide with optional transition metadata.
 *
 * @param props - Configuration options for the slide component.
 * @returns A slide element.
 */
export const Slide = ({
  steps,
  transition,
  className,
  onEnter,
  onExit,
  children
}: SlideProps): JSX.Element => {
  const maxSteps = useDeckStore(state => state.maxSteps)
  const setMaxSteps = useDeckStore(state => state.setMaxSteps)
  const computedSteps = useMemo(
    () => Math.max(steps ?? 0, getAppearMax(children)),
    [steps, children]
  )
  const runEnter = useSerializedDirectiveRunner(onEnter ?? '[]')
  const runExit = useSerializedDirectiveRunner(onExit ?? '[]')
  const runExitRef = useRef(runExit)
  const onExitRef = useRef(onExit)

  const contextValue = useMemo(() => {
    if (!transition) return {}
    if ('type' in transition) {
      return { enter: transition, exit: transition }
    }
    return { enter: transition.enter, exit: transition.exit }
  }, [transition])

  useEffect(() => {
    if (computedSteps !== maxSteps) {
      setMaxSteps(computedSteps)
    }
  }, [computedSteps, maxSteps, setMaxSteps])

  useEffect(() => {
    runEnter()
    // Run once when the slide becomes active
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    runExitRef.current = runExit
    onExitRef.current = onExit
  }, [runExit, onExit])

  useLayoutEffect(() => {
    return () => {
      if (onExitRef.current) {
        runExitRef.current()
      }
    }
  }, [])

  return (
    <SlideTransitionContext.Provider value={contextValue}>
      <div
        className={`relative w-full h-full overflow-hidden ${className ?? ''}`}
        data-transition={transition ? JSON.stringify(transition) : undefined}
        data-testid='slide'
      >
        {children}
      </div>
    </SlideTransitionContext.Provider>
  )
}

export default Slide

export { Appear } from './Appear'
export { SlideText } from './SlideText'
export { Layer } from './Layer'
export type { LayerProps } from './Layer'
export { renderDirectiveMarkdown } from './renderDirectiveMarkdown'
