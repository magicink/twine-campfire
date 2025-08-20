import { useCallback, useMemo } from 'preact/hooks'
import type { RootContent } from 'mdast'
import type { ContainerDirective } from 'mdast-util-directive'
import rfdc from 'rfdc'
import { evalExpression } from '@campfire/utils/evalExpression'
import { runDirectiveBlock } from '@campfire/utils/directiveHelpers'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { useGameStore } from '@campfire/state/useGameStore'
import { getLabel, stripLabel } from '@campfire/remark-campfire/helpers'

const clone = rfdc()

/**
 * Creates a runner for executing serialized directive content.
 *
 * @param content - Serialized directive block to execute.
 * @returns Function that runs the block with current game data.
 */
export const useSerializedDirectiveRunner = (content: string) => {
  const handlers = useDirectiveHandlers()
  const baseNodes = useMemo<RootContent[]>(() => JSON.parse(content), [content])

  const resolveIf = (
    nodes: RootContent[],
    data: Record<string, unknown>
  ): RootContent[] =>
    nodes.flatMap(node => {
      if (
        node.type === 'containerDirective' &&
        (node as ContainerDirective).name === 'if'
      ) {
        const container = node as ContainerDirective
        const test = getLabel(container) || ''
        let condition = false
        try {
          condition = !!evalExpression(test, data)
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
        return resolveIf(branch, data)
      }
      return [node]
    })

  const runBlock = (block: RootContent[], data: Record<string, unknown>) => {
    const processed = resolveIf(block, data)
    if (processed.length === 0) return
    runDirectiveBlock(processed, handlers)
  }

  const gameData = useGameStore(state => state.gameData)

  return useCallback(() => {
    runBlock(clone(baseNodes), gameData as Record<string, unknown>)
  }, [baseNodes, handlers, gameData])
}
