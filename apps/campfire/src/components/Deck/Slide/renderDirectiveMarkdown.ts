import type { ComponentChild } from 'preact'
import type { DirectiveHandler } from '@campfire/remark-campfire'
import componentMap from '@campfire/components/Passage/componentMap'
import { Deck } from '@campfire/components/Deck/Deck'
import { Slide } from './Slide'
import { SlideReveal } from './SlideReveal'
import { Layer } from './Layer'
import { SlideText, SlideImage, SlideShape, SlideEmbed } from './SlideElements'
import { Effect } from '@campfire/components/Passage/Effect'
import { OnExit } from '@campfire/components/Passage/OnExit'
import { createMarkdownProcessor } from '@campfire/utils/createMarkdownProcessor'

const {
  deck: _deck,
  slide: _slide,
  reveal: _reveal,
  layer: _layer,
  slideText: _slideText,
  slideImage: _slideImage,
  slideShape: _slideShape,
  slideEmbed: _slideEmbed,
  effect: _effect,
  onExit: _onExit,
  ...passageComponents
} = componentMap

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
    ...passageComponents,
    effect: Effect,
    onExit: OnExit,
    deck: Deck,
    slide: Slide,
    reveal: SlideReveal,
    layer: Layer,
    slideText: SlideText,
    slideImage: SlideImage,
    slideShape: SlideShape,
    slideEmbed: SlideEmbed
  })
  const file = processor.processSync(markdown)
  return file.result as ComponentChild
}
