import { useEffect, useMemo } from 'preact/hooks'
import type { ComponentChild } from 'preact'
import type { Content, Text as HastText } from 'hast'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { createMarkdownProcessor } from '@campfire/utils/createMarkdownProcessor'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { useOverlayStore } from '@campfire/state/useOverlayStore'
import { Deck, type DeckProps } from '@campfire/components/Deck/Deck'
import {
  SlideReveal,
  type SlideRevealProps
} from '@campfire/components/Deck/Slide/SlideReveal'
import { componentMap } from '@campfire/components/Passage/componentMap'
import { useOverlayDeckStore } from '@campfire/state/useOverlayDeckStore'
import { normalizeDirectiveIndentation } from '@campfire/utils/normalizeDirectiveIndentation'

/**
 * Processes overlay passages into persistent components rendered above passages.
 */
export const useOverlayProcessor = (): void => {
  const handlers = useDirectiveHandlers()
  const overlays = useStoryDataStore.use.overlayPassages()
  const setOverlays = useOverlayStore.use.setOverlays()

  /**
   * Deck component bound to the overlay deck store.
   *
   * @param props - Standard deck properties.
   * @returns The overlay deck element.
   */
  const OverlayDeck = (props: DeckProps) => (
    <Deck {...props} store={useOverlayDeckStore} />
  )
  /**
   * SlideReveal component bound to the overlay deck store.
   *
   * @param props - Standard slide reveal properties.
   * @returns The overlay slide reveal element.
   */
  const OverlayReveal = (props: SlideRevealProps) => (
    <SlideReveal {...props} store={useOverlayDeckStore} />
  )
  const processor = useMemo(
    () =>
      createMarkdownProcessor(handlers, {
        ...componentMap,
        deck: OverlayDeck,
        reveal: OverlayReveal
      }),
    [handlers]
  )

  useEffect(() => {
    const controller = new AbortController()
    ;(async () => {
      // TODO(campfire): Batch processing or yield to the event loop between
      // passages to keep overlays responsive on large stories; surface parser
      // errors to a user-visible channel instead of console-only.
      const items = [] as {
        name: string
        component: ComponentChild
        visible: boolean
        zIndex: number
        group?: string
      }[]
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
        const tags =
          typeof passage.properties?.tags === 'string'
            ? passage.properties.tags.toLowerCase().split(/\s+/)
            : []
        let zIndex = 0
        let group: string | undefined
        for (const tag of tags) {
          if (tag.startsWith('overlay-z')) {
            const z = parseInt(tag.replace('overlay-z', ''), 10)
            if (!Number.isNaN(z)) zIndex = z
          } else if (tag.startsWith('overlay-group-')) {
            group = tag.replace('overlay-group-', '')
          }
        }
        items.push({
          name,
          component: file.result as ComponentChild,
          visible: true,
          zIndex,
          group
        })
      }
      if (!controller.signal.aborted) {
        setOverlays(items.sort((a, b) => a.zIndex - b.zIndex))
      }
    })()
    return () => controller.abort()
  }, [overlays, processor, setOverlays])
}
