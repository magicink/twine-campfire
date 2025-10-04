import { cloneElement, type ComponentChild, type VNode } from 'preact'
import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import type { Content } from 'hast'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import {
  remarkHeadingStyles,
  remarkParagraphStyles
} from '@campfire/utils/remarkStyles'
import { createMarkdownProcessor } from '@campfire/utils/createMarkdownProcessor'
import { normalizeDirectiveIndentation } from '@campfire/utils/normalizeDirectiveIndentation'
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
import { getPassageText } from '@campfire/utils/core'

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
 * Recursively clones a component tree so cached VNodes can be reused safely.
 *
 * @param node - Component tree to clone.
 * @returns A fresh copy of the component tree.
 */
const cloneTree = (node: ComponentChild): ComponentChild => {
  if (Array.isArray(node)) return node.map(cloneTree)
  if (node && typeof node === 'object' && 'type' in node) {
    const vnode = node as VNode
    const children = vnode.props?.children
    const clonedChildren = Array.isArray(children)
      ? children.map(cloneTree)
      : children !== undefined
        ? cloneTree(children)
        : undefined
    return cloneElement(vnode, vnode.props, clonedChildren)
  }
  return node
}

/**
 * Checks whether a passage with the given source text can be cached safely.
 * Passages containing load directives must always be reprocessed to execute
 * game-state side effects.
 *
 * @param text - Raw passage text.
 * @returns `true` when the passage may be cached.
 */
const canCachePassage = (text: string): boolean => !/::load\b/.test(text)

/**
 * Retrieves the shared passage cache for compiled content.
 * Stored globally to survive hot reloads and allow size management.
 *
 * @returns Cache map keyed by passage id.
 */
const getPassageCache = (): Map<
  string,
  { text: string; content: ComponentChild }
> =>
  (globalThis.__campfirePassageCache ??= new Map<
    string,
    { text: string; content: ComponentChild }
  >())

/** Maximum number of passages to retain in cache. */
const MAX_PASSAGE_CACHE = 100

/**
 * Normalizes passage text without using Web Workers.
 * Defers execution with `requestIdleCallback` when available to avoid
 * blocking rendering during large updates.
 *
 * @param text - Raw passage text.
 * @returns Promise resolving to normalized text.
 */
const normalizePassageText = (text: string): Promise<string> =>
  new Promise(resolve => {
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      window.requestIdleCallback(() =>
        resolve(normalizeDirectiveIndentation(text))
      )
      return
    }

    setTimeout(() => resolve(normalizeDirectiveIndentation(text)), 0)
  })

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
    const passageId =
      typeof passage.properties?.pid === 'string'
        ? passage.properties.pid
        : undefined
    const isNewPassage = prevPassageId.current !== passageId
    if (isNewPassage) {
      prevPassageId.current = passageId
      clearTitleOverride()
      resetDeck()
    }
    const passageName =
      typeof passage.properties?.name === 'string'
        ? passage.properties.name
        : undefined
    if (!isTitleOverridden()) {
      const storyName = storyData.name as string | undefined
      const separator =
        (storyData['title-separator'] as string | undefined) ?? ': '
      const showPassage =
        storyData['title-show-passage'] !== 'false' &&
        storyData['title-show-passage'] !== false
      const title = buildTitle(storyName, passageName, separator, showPassage)
      if (title) {
        document.title = title
      }
    }
  }, [passage, storyData, resetDeck])

  useEffect(() => {
    const controller = new AbortController()
    ;(async () => {
      if (controller.signal.aborted) return
      if (!passage) {
        setContent(null)
        return
      }
      const id =
        typeof passage.properties?.pid === 'string'
          ? passage.properties.pid
          : undefined
      const text = getPassageText(passage.children as Content[])
      const cache = getPassageCache()
      const shouldCache = id && canCachePassage(text)
      const cached = shouldCache ? cache.get(id) : undefined
      if (shouldCache && cached && cached.text === text) {
        setContent(cloneTree(cached.content))
        return
      }
      const normalized = await normalizePassageText(text)
      if (controller.signal.aborted) return
      const file = await processor.process(normalized)
      if (controller.signal.aborted) return
      const result = file.result as ComponentChild
      if (shouldCache) {
        cache.set(id as string, { text, content: result })
        while (cache.size > MAX_PASSAGE_CACHE) {
          const oldest = cache.keys().next().value as string | undefined
          if (oldest) cache.delete(oldest)
        }
      }
      setContent(cloneTree(result))
    })()
    return () => controller.abort()
  }, [passage, processor])

  return (
    <div className='campfire-passage h-full' data-testid='passage'>
      {content}
    </div>
  )
}
