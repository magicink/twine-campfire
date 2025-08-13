import {
  cloneElement,
  isValidElement,
  toChildArray,
  type ComponentChildren,
  type VNode,
  type JSX
} from 'preact'
import { useLayoutEffect, useState } from 'preact/hooks'

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
export const DEFAULT_TRANSITION_DURATION = 300

/**
 * Animates its children using a simple CSS-based transition.
 * If a single element child is provided, the styles are applied directly
 * to that element to avoid introducing additional wrapper nodes that can
 * disrupt document structure.
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
  const nodes = toChildArray(children)
  const single = nodes.length === 1 && isValidElement(nodes[0])
  if (single) {
    const child = nodes[0] as VNode<{ style?: JSX.CSSProperties }>
    const merged: JSX.CSSProperties = {
      ...(child.props.style ?? {}),
      ...style
    }
    return cloneElement(child, { style: merged })
  }
  return (
    <div style={style} role='presentation'>
      {children}
    </div>
  )
}

export type { TransitionProps }
