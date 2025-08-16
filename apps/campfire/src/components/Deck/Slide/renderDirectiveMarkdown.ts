import type { ComponentChild } from 'preact'
import type { DirectiveHandler } from '@campfire/remark-campfire'
import { LinkButton } from '@campfire/components/Passage/LinkButton'
import { TriggerButton } from '@campfire/components/Passage/TriggerButton'
import { If } from '@campfire/components/Passage/If'
import { Show } from '@campfire/components/Passage/Show'
import { OnExit } from '@campfire/components/Passage/OnExit'
import { Deck } from '@campfire/components/Deck'
import { Slide } from '.'
import { Appear } from './Appear'
import { DeckText } from './DeckText'
import { createMarkdownProcessor } from '@campfire/utils/createMarkdownProcessor'

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
  const processor = createMarkdownProcessor(handlers, {
    button: LinkButton,
    trigger: TriggerButton,
    if: If,
    show: Show,
    onExit: OnExit,
    deck: Deck,
    slide: Slide,
    appear: Appear,
    'deck-text': DeckText
  })
  const file = processor.processSync(markdown)
  return file.result as ComponentChild
}
