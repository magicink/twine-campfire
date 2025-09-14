import type { ComponentChild } from 'preact'
import type { DirectiveHandler } from '@campfire/remark-campfire'
import { LinkButton } from '@campfire/components/Passage/LinkButton'
import { TriggerButton } from '@campfire/components/Passage/TriggerButton'
import { Input } from '@campfire/components/Passage/Input'
import { Checkbox } from '@campfire/components/Passage/Checkbox'
import { Radio } from '@campfire/components/Passage/Radio'
import { Textarea } from '@campfire/components/Passage/Textarea'
import { Select } from '@campfire/components/Passage/Select'
import { Option } from '@campfire/components/Passage/Option'
import { If } from '@campfire/components/Passage/If'
import { Show } from '@campfire/components/Passage/Show'
import { Translate } from '@campfire/components/Passage/Translate'
import { OnExit } from '@campfire/components/Passage/OnExit'
import { Effect } from '@campfire/components/Passage/Effect'
import { Switch } from '@campfire/components/Passage/Switch'
import { Deck } from '@campfire/components/Deck/Deck'
import { Slide } from './Slide'
import { SlideReveal } from './SlideReveal'
import { Layer } from './Layer'
import { SlideText, SlideImage, SlideShape, SlideEmbed } from './SlideElements'
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
    input: Input,
    checkbox: Checkbox,
    radio: Radio,
    textarea: Textarea,
    select: Select,
    option: Option,
    if: If,
    show: Show,
    translate: Translate,
    effect: Effect,
    onExit: OnExit,
    switch: Switch,
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
