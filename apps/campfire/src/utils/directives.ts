import { unified } from 'unified'
import remarkCampfire, {
  remarkCampfireIndentation,
  type DirectiveHandler
} from '@campfire/remark-campfire'
import type { Root, RootContent } from 'mdast'

/**
 * Determines whether a value is a valid `RootContent` node.
 *
 * @param value - The value to examine.
 * @returns True if the value is `RootContent`.
 */
const isRootContentNode = (value: unknown): value is RootContent =>
  typeof value === 'object' && value !== null && 'type' in value

/**
 * Processes directive AST nodes through the Campfire remark pipeline.
 *
 * @param nodes - Nodes to process.
 * @param handlers - Optional directive handlers to apply.
 * @returns The processed array of nodes.
 */
export const runDirectiveBlock = (
  nodes: RootContent[],
  handlers: Record<string, DirectiveHandler> = {}
): RootContent[] => {
  const root: Root = { type: 'root', children: nodes }
  unified()
    .use(remarkCampfireIndentation)
    .use(remarkCampfire, { handlers })
    .runSync(root)
  const { children } = root
  if (!(children as unknown[]).every(isRootContentNode)) {
    throw new TypeError(
      'Processed directive nodes contain unexpected node types'
    )
  }
  return children
}
