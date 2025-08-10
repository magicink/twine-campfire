import { useCallback, useMemo } from 'preact/hooks'
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
          const fn = compile(test)
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
        return resolveIf(branch, data)
      }
      return [node]
    })

  const runBlock = (block: RootContent[], data: Record<string, unknown>) => {
    const processed = resolveIf(block, data)
    if (processed.length === 0) return
    const root: Root = { type: 'root', children: processed }
    unified()
      .use(remarkCampfireIndentation)
      .use(remarkCampfire, { handlers })
      .runSync(root)
  }

  return useCallback(() => {
    const gameData = useGameStore.getState().gameData as Record<string, unknown>
    runBlock(clone(baseNodes), gameData)
  }, [baseNodes, handlers])
}
