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
  rehypeChecklistButtons
} from '@campfire/utils/remarkStyles'
import rehypeReact from 'rehype-react'
import { Fragment, jsx, jsxs } from 'preact/jsx-runtime'
import type { ComponentType } from 'preact'
import type { DirectiveHandler } from '@campfire/remark-campfire'
import type { PluggableList } from 'unified'

/**
 * Creates a unified processor that converts Markdown with Campfire directives
 * into Preact nodes.
 *
 * @param handlers - Directive handlers for remark-campfire.
 * @param components - Mapping of directive names to Preact components.
 * @param remarkPlugins - Optional remark plugins applied before remark-rehype.
 * @returns Configured unified processor.
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
    .use(rehypeTableStyles)
    .use(rehypeReact, { Fragment, jsx, jsxs, components })
