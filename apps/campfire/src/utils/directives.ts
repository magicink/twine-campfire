import { unified } from 'unified'
import remarkCampfire, {
  remarkCampfireIndentation,
  type DirectiveHandler
} from '@campfire/remark-campfire'
import type { Root, RootContent } from 'mdast'

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
  return root.children as RootContent[]
}
