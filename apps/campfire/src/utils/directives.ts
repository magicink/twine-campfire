import { unified } from 'unified'
import remarkCampfire, {
  remarkCampfireIndentation,
  type DirectiveHandler
} from '@campfire/remark-campfire'
import type { Root, RootContent } from 'mdast'

/**
 * Runs a block of directive AST nodes through the Campfire remark pipeline.
 *
 * @param nodes - Nodes to process.
 * @param handlers - Directive handlers to apply.
 */
export const runDirectiveBlock = (
  nodes: RootContent[],
  handlers: Record<string, DirectiveHandler>
): void => {
  const root: Root = { type: 'root', children: nodes }
  unified()
    .use(remarkCampfireIndentation)
    .use(remarkCampfire, { handlers })
    .runSync(root)
}
