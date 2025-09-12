import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import type { ComponentChild } from 'preact'
import type { Text as HastText, Content } from 'hast'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import {
  remarkHeadingStyles,
  remarkParagraphStyles
} from '@campfire/utils/remarkStyles'
import { createMarkdownProcessor } from '@campfire/utils/createMarkdownProcessor'
import { scanDirectives } from '@campfire/utils/scanDirectives'
import {
  isTitleOverridden,
  clearTitleOverride
} from '@campfire/state/titleState'
import {
  useStoryDataStore,
  type StoryDataState
} from '@campfire/state/useStoryDataStore'
import { useDeckStore } from '@campfire/state/useDeckStore'
import { componentMap } from '@campfire/components/Passage/componentMap'

/**
 * Normalizes directive indentation so Markdown treats directive lines the same
 * regardless of leading spaces or tabs. Uses {@link scanDirectives} to walk the
 * source once and remove tabs or four-or-more spaces before directive markers.
 *
 * @param input - Raw passage text.
 * @returns Passage text with directive indentation normalized.
 */
const normalizeDirectiveIndentation = (input: string): string => {
  const shouldStrip = (indent: string): boolean => {
    if (!indent) return false
    let tabs = true
    let spaces = true
    for (const ch of indent) {
      if (ch !== '\t') tabs = false
      if (ch !== ' ') spaces = false
    }
    return tabs || (spaces && indent.length >= 4)
  }

  let output = ''
  let lineStart = 0
  for (const token of scanDirectives(input)) {
    if (token.type === 'text') {
      output += token.value
    } else {
      const indent = output.slice(lineStart).match(/^[\t ]*/)?.[0] ?? ''
      if (shouldStrip(indent)) output = output.slice(0, lineStart)
      output += token.value
    }
    const lastNewline = token.value.lastIndexOf('\n')
    if (lastNewline !== -1) {
      lineStart = output.length - (token.value.length - lastNewline - 1)
    }
  }
  return output
}

/**
 * Builds a document title from story and passage names.
 *
 * @param storyName - Name of the story.
 * @param passageName - Name of the current passage.
 * @param separator - String used to separate story and passage names.
 * @param showPassage - Whether to include the passage name in the title.
 * @returns Formatted document title.
 */
const buildTitle = (
  storyName: string | undefined,
  passageName: string | undefined,
  separator: string,
  showPassage: boolean
): string => {
  if (!storyName) return passageName ?? ''
  if (!showPassage || !passageName) return storyName
  return `${storyName}${separator}${passageName}`
}

/**
 * Renders the current passage from the story data store.
 * The passage text is processed with Remark and Rehype plugins
 * to support Campfire directives and custom components.
 */
export const Passage = () => {
  const handlers = useDirectiveHandlers()
  const processor = useMemo(
    () =>
      createMarkdownProcessor(handlers, componentMap, [
        remarkParagraphStyles,
        remarkHeadingStyles
      ]),
    [handlers]
  )
  const passage = useStoryDataStore((state: StoryDataState) =>
    state.getCurrentPassage()
  )
  const storyData = useStoryDataStore.use.storyData()
  const resetDeck = useDeckStore.use.reset()
  const [content, setContent] = useState<ComponentChild | null>(null)
  const prevPassageId = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!passage) return
    const id =
      typeof passage.properties?.pid === 'string'
        ? passage.properties.pid
        : undefined
    const isNewPassage = prevPassageId.current !== id
    if (isNewPassage) {
      prevPassageId.current = id
      clearTitleOverride()
      resetDeck()
    }
    const name =
      typeof passage.properties?.name === 'string'
        ? passage.properties.name
        : undefined
    if (!isTitleOverridden()) {
      const storyName =
        typeof storyData.name === 'string' ? storyData.name : undefined
      const separator =
        typeof storyData['title-separator'] === 'string'
          ? (storyData['title-separator'] as string)
          : ': '
      const showPassage =
        storyData['title-show-passage'] !== 'false' &&
        storyData['title-show-passage'] !== false
      const title = buildTitle(storyName, name, separator, showPassage)
      if (title) {
        document.title = title
      }
    }
  }, [passage, storyData, resetDeck])

  useEffect(() => {
    const controller = new AbortController()
    ;(async () => {
      // TODO(campfire): Consider yielding across frames or using a worker to
      // process very large passages; add error boundary/logging for parse
      // failures and ensure end-of-block directive sentinels are respected.
      if (controller.signal.aborted) return
      if (!passage) {
        setContent(null)
        return
      }
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
      setContent(file.result as ComponentChild)
    })()
    return () => controller.abort()
  }, [passage, processor])

  return (
    <div className='campfire-passage h-full' data-testid='passage'>
      {content}
    </div>
  )
}
