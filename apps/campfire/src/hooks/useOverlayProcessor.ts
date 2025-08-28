import { useEffect, useMemo } from 'preact/hooks'
import type { ComponentChild } from 'preact'
import type { Content, Text as HastText } from 'hast'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { createMarkdownProcessor } from '@campfire/utils/createMarkdownProcessor'
import {
  useStoryDataStore,
  type StoryDataState
} from '@campfire/state/useStoryDataStore'
import { useOverlayStore } from '@campfire/state/useOverlayStore'
import { LinkButton } from '@campfire/components/Passage/LinkButton'
import { TriggerButton } from '@campfire/components/Passage/TriggerButton'
import { Input } from '@campfire/components/Passage/Input'
import { Textarea } from '@campfire/components/Passage/Textarea'
import { Select } from '@campfire/components/Passage/Select'
import { Option } from '@campfire/components/Passage/Option'
import { If } from '@campfire/components/Passage/If'
import { Show } from '@campfire/components/Passage/Show'
import { Translate } from '@campfire/components/Passage/Translate'
import { OnExit } from '@campfire/components/Passage/OnExit'
import { Deck } from '@campfire/components/Deck/Deck'
import {
  Slide,
  SlideReveal,
  SlideText,
  SlideImage,
  SlideShape,
  Layer
} from '@campfire/components/Deck/Slide'

const DIRECTIVE_MARKER_PATTERN = '(:::[^\\n]*|:[^\\n]*|<<)'

/**
 * Normalizes directive indentation to ensure consistent parsing.
 *
 * @param input - Raw overlay passage text.
 * @returns The normalized text.
 */
const normalizeDirectiveIndentation = (input: string): string =>
  input
    .replace(new RegExp(`^\\t+(?=(${DIRECTIVE_MARKER_PATTERN}))`, 'gm'), '')
    .replace(new RegExp(`^[ ]{4,}(?=(${DIRECTIVE_MARKER_PATTERN}))`, 'gm'), '')

/**
 * Processes overlay passages into persistent components rendered above passages.
 */
export const useOverlayProcessor = (): void => {
  const handlers = useDirectiveHandlers()
  const overlays = useStoryDataStore(
    (state: StoryDataState) => state.overlayPassages
  )
  const setOverlays = useOverlayStore(state => state.setOverlays)

  const processor = useMemo(
    () =>
      createMarkdownProcessor(handlers, {
        button: LinkButton,
        trigger: TriggerButton,
        input: Input,
        textarea: Textarea,
        select: Select,
        option: Option,
        if: If,
        show: Show,
        translate: Translate,
        onExit: OnExit,
        deck: Deck,
        slide: Slide,
        reveal: SlideReveal,
        layer: Layer,
        slideText: SlideText,
        slideImage: SlideImage,
        slideShape: SlideShape
      }),
    [handlers]
  )

  useEffect(() => {
    const controller = new AbortController()
    ;(async () => {
      const items = [] as { name: string; component: ComponentChild }[]
      for (const passage of overlays) {
        const text = passage.children
          .map((child: Content) =>
            child.type === 'text' && typeof child.value === 'string'
              ? (child as HastText).value
              : ''
          )
          .join('')
        const normalized = normalizeDirectiveIndentation(text)
        if (controller.signal.aborted) return
        const file = await processor.process(normalized)
        if (controller.signal.aborted) return
        const name =
          typeof passage.properties?.name === 'string'
            ? passage.properties.name
            : String(passage.properties?.pid)
        items.push({ name, component: file.result as ComponentChild })
      }
      if (!controller.signal.aborted) {
        setOverlays(items)
      }
    })()
    return () => controller.abort()
  }, [overlays, processor, setOverlays])
}
