import type { ComponentType } from 'preact'
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
import { Deck } from '@campfire/components/Deck/Deck'
import {
  Slide,
  SlideReveal,
  SlideText,
  SlideImage,
  SlideShape,
  SlideEmbed,
  Layer
} from '@campfire/components/Deck/Slide'

/**
 * Maps directive names to their corresponding Campfire components.
 */
export const componentMap: Record<string, ComponentType<any>> = {
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
  deck: Deck,
  slide: Slide,
  reveal: SlideReveal,
  layer: Layer,
  slideText: SlideText,
  slideImage: SlideImage,
  slideShape: SlideShape,
  slideEmbed: SlideEmbed
}

export default componentMap
