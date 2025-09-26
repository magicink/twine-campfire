import { useCallback, useMemo } from 'preact/hooks'
import type { RootContent } from 'mdast'
import type { ContainerDirective } from 'mdast-util-directive'
import rfdc from 'rfdc'
import { evalExpression } from '@campfire/utils/core'
import { runDirectiveBlock } from '@campfire/utils/directiveUtils'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { useGameStore } from '@campfire/state/useGameStore'
import { getLabel, stripLabel } from '@campfire/utils/directiveUtils'

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
        return condition ? resolveIf(children, data) : []
      }
      return [node]
    })

  const runBlock = (block: RootContent[], data: Record<string, unknown>) => {
    const processed = resolveIf(block, data)
    if (processed.length === 0) return
    runDirectiveBlock(processed, handlers)
  }

  const gameData = useGameStore.use.gameData()

  return useCallback(() => {
    // TODO(campfire): Profile large blocks to avoid long
    // main-thread work during interactions.
    runBlock(clone(baseNodes), gameData as Record<string, unknown>)
  }, [baseNodes, handlers, gameData])
}
