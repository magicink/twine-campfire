import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import remarkCampfire from '@campfire/remark-campfire'
import remarkRehype from 'remark-rehype'
import rehypeCampfire from '@campfire/rehype-campfire'
import rehypeSlideText from '@campfire/utils/rehypeSlideText'
import {
  rehypeTableStyles,
  rehypeChecklistButtons,
  rehypeRadioButtons
} from '@campfire/utils/remarkStyles'
import rehypeReact from 'rehype-react'
import { Fragment, jsx, jsxs } from 'preact/jsx-runtime'
import type { ComponentType } from 'preact'
import type { DirectiveHandler } from '@campfire/remark-campfire'
import type { PluggableList } from 'unified'

/**
 * Builds a unified processor that renders Campfire markdown as Preact nodes.
 *
 * @param handlers - remark-campfire directive handlers.
 * @param components - Map of directive names to Preact components.
 * @param remarkPlugins - Optional remark plugins applied before remark-rehype.
 * @returns Configured processor.
 */
export const createMarkdownProcessor = (
  handlers: Record<string, DirectiveHandler>,
  components: Record<string, ComponentType<any>>,
  remarkPlugins: PluggableList = []
) =>
  unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkCampfire, { handlers })
    .use(remarkPlugins)
    .use(remarkRehype)
    .use(rehypeCampfire)
    .use(rehypeSlideText)
    .use(rehypeChecklistButtons)
    .use(rehypeRadioButtons)
    .use(rehypeTableStyles)
    .use(rehypeReact, { Fragment, jsx, jsxs, components })
