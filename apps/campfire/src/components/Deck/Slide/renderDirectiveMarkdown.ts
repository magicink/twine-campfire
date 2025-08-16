import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import remarkCampfire from '@campfire/remark-campfire'
import remarkRehype from 'remark-rehype'
import rehypeCampfire from '@campfire/rehype-campfire'
import rehypeReact from 'rehype-react'
import { Fragment, jsx, jsxs } from 'preact/jsx-runtime'
import type { ComponentChild } from 'preact'
import type { DirectiveHandler } from '@campfire/remark-campfire'
import { LinkButton } from '@campfire/components/Passage/LinkButton'
import { TriggerButton } from '@campfire/components/Passage/TriggerButton'
import { If } from '@campfire/components/Passage/If'
import { Show } from '@campfire/components/Passage/Show'
import { OnExit } from '@campfire/components/Passage/OnExit'
import { Deck } from '@campfire/components/Deck'
import { Slide } from './'
import { Appear } from '@campfire/components/Deck/Slide/Appear'
import { Text } from '@campfire/components/Deck/Slide/Text'

/**
 * Converts Markdown containing Campfire directives into Preact elements.
 * Runs directive handlers while converting the Markdown tree.
 *
 * @param markdown - Markdown string that may include directive containers.
 * @param handlers - Directive handlers for processing directives.
 * @returns The rendered Preact content.
 */
export const renderDirectiveMarkdown = (
  markdown: string,
  handlers: Record<string, DirectiveHandler>
): ComponentChild => {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkCampfire, { handlers })
    .use(remarkRehype)
    .use(rehypeCampfire)
    .use(rehypeReact, {
      Fragment,
      jsx,
      jsxs,
      components: {
        button: LinkButton,
        trigger: TriggerButton,
        if: If,
        show: Show,
        onExit: OnExit,
        deck: Deck,
        slide: Slide,
        appear: Appear,
        text: Text
      }
    })

  const file = processor.processSync(markdown)
  return file.result as ComponentChild
}
