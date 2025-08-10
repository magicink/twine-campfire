import { useEffect, useMemo, useRef } from 'react'
import { unified } from 'unified'
import remarkCampfire, {
  remarkCampfireIndentation
} from '@/packages/remark-campfire'
import type { RootContent, Root } from 'mdast'
import type { ContainerDirective } from 'mdast-util-directive'
import rfdc from 'rfdc'
import { compile } from 'expression-eval'
import { useDirectiveHandlers } from './useDirectiveHandlers'
import { useGameStore } from '@/packages/use-game-store'
import { getLabel, stripLabel } from './directives/helpers'

const clone = rfdc()

/** Props for the `OnExit` component. */
interface OnExitProps {
  /** Serialized content to run when exiting a passage */
  content: string
}

/**
 * Executes serialized directive content once when unmounted.
 *
 * @param content - Serialized directive block to process on exit.
 */
export const OnExit = ({ content }: OnExitProps) => {
  const handlers = useDirectiveHandlers()
  const baseNodes = useMemo<RootContent[]>(() => JSON.parse(content), [content])
  const cleanupRanRef = useRef(false)
  const generationRef = useRef(0)

  /**
   * Resolves `if` directives by evaluating their test expressions and
   * recursively returning the content for the matching branch.
   *
   * @param nodes - Nodes to inspect.
   * @returns Nodes with conditionals resolved.
   */
  const resolveIf = (nodes: RootContent[]): RootContent[] =>
    nodes.flatMap(node => {
      if (
        node.type === 'containerDirective' &&
        (node as ContainerDirective).name === 'if'
      ) {
        const container = node as ContainerDirective
        const test = getLabel(container) || ''
        let condition = false
        try {
          const fn = compile(test)
          const data = useGameStore.getState().gameData as Record<
            string,
            unknown
          >
          condition = !!fn(data)
        } catch {
          condition = false
        }
        const children = stripLabel(container.children as RootContent[])
        const elseIndex = children.findIndex(
          child =>
            child.type === 'containerDirective' &&
            (child as ContainerDirective).name === 'else'
        )
        let branch: RootContent[] = []
        if (condition) {
          branch = elseIndex === -1 ? children : children.slice(0, elseIndex)
        } else if (elseIndex !== -1) {
          const elseNode = children[elseIndex] as ContainerDirective
          branch = stripLabel(elseNode.children as RootContent[])
        }
        return resolveIf(branch)
      }
      return [node]
    })

  /**
   * Processes a block of nodes with the Campfire remark plugins.
   *
   * @param block - Nodes to execute.
   */
  const runBlock = (block: RootContent[]) => {
    const processed = resolveIf(block)
    if (processed.length === 0) return
    const root: Root = { type: 'root', children: processed }
    unified()
      .use(remarkCampfireIndentation)
      .use(remarkCampfire, { handlers })
      .runSync(root)
  }

  useEffect(() => {
    generationRef.current++
    cleanupRanRef.current = false
    return () => {
      const current = generationRef.current
      queueMicrotask(() => {
        if (generationRef.current === current && !cleanupRanRef.current) {
          runBlock(clone(baseNodes))
          cleanupRanRef.current = true
        }
      })
    }
  }, [baseNodes])

  return null
}
