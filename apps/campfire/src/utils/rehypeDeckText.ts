import { visit } from 'unist-util-visit'
import type { Root } from 'hast'

/**
 * Rewrites elements marked with `data-component="deck-text"` into
 * `<deck-text>` nodes for component rendering and passes along the
 * original tag via the `as` prop.
 *
 * @returns A rehype plugin that mutates the tree in place.
 */
export const rehypeDeckText =
  () =>
  (tree: Root): void => {
    visit(tree, 'element', node => {
      const props = node.properties as Record<string, unknown>
      if (props['data-component'] !== 'deck-text') return
      const as = props['data-as'] as string | undefined
      node.tagName = 'deck-text'
      if (as) props.as = as
      delete props['data-component']
      delete props['data-as']
    })
  }

export default rehypeDeckText
