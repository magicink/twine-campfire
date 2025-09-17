import { toChildArray, type ComponentChildren, type VNode } from 'preact'
import { SlideReveal } from './SlideReveal'

/**
 * Recursively determines the highest step index contributed by SlideReveal
 * components within a tree.
 *
 * @param children - Slide children to inspect.
 * @returns The maximum step index discovered.
 */
export const getRevealMax = (children: ComponentChildren): number => {
  let max = 0
  let hasReveal = false
  const walk = (nodes: ComponentChildren): void => {
    toChildArray(nodes).forEach(node => {
      if (typeof node === 'object' && node !== null && 'type' in node) {
        const child = node as VNode<any>
        if (child.type === SlideReveal) {
          hasReveal = true
          const at = child.props.at ?? 0
          const exitAt = child.props.exitAt ?? at
          max = Math.max(max, at, exitAt)
        }
        if (child.props?.children) {
          walk(child.props.children)
        }
      }
    })
  }
  walk(children)
  return hasReveal && max <= 0 ? 1 : max
}

export default getRevealMax
