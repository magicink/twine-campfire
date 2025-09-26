import { cloneElement, type ComponentChild, type VNode } from 'preact'
import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import type { Text as HastText, Content } from 'hast'
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
import type { WorkerRequest, WorkerResponse } from './directiveWorker'

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

/** Shape of the shared directive worker state. */
interface WorkerState {
  worker: Worker | null
  pending: Map<number, (r: string) => void>
  nextId: number
  unloadHandler?: () => void
}

/**
 * Retrieves the singleton Web Worker state used for directive normalization.
 * Stored on the global object to avoid duplication across hot reloads.
 *
 * @returns Worker state singleton.
 */
const getWorkerState = (): WorkerState =>
  (globalThis.__campfirePassageWorker ??= {
    worker: null,
    pending: new Map<number, (r: string) => void>(),
    nextId: 0
  })

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
 * Lazily creates the directive normalization worker in supported browsers.
 * Subsequent calls reuse the existing worker and add a single unload cleanup.
 */
const initWorker = () => {
  const state = getWorkerState()
  if (
    state.worker ||
    typeof window === 'undefined' ||
    typeof Worker === 'undefined'
  )
    return

  state.worker = new Worker(new URL('./directiveWorker.ts', import.meta.url), {
    type: 'module'
  })

  if (!state.unloadHandler) {
    state.unloadHandler = () => {
      state.worker?.terminate()
      state.worker = null
      window.removeEventListener('beforeunload', state.unloadHandler!)
      state.unloadHandler = undefined
    }
    window.addEventListener('beforeunload', state.unloadHandler)
  }

  state.worker.onmessage = event => {
    const { id, result } = event.data as WorkerResponse
    const resolver = state.pending.get(id)
    if (resolver) {
      resolver(result)
      state.pending.delete(id)
    }
  }
}

/**
 * Normalizes passage text in a Web Worker when available.
 * Falls back to main-thread processing using `requestIdleCallback` or
 * `setTimeout` when workers are unsupported.
 *
 * @param text - Raw passage text.
 * @returns Promise resolving to normalized text.
 */
const parseInWorker = (text: string): Promise<string> => {
  const state = getWorkerState()
  initWorker()

  return state.worker
    ? new Promise(resolve => {
        const id = state.nextId++
        state.pending.set(id, resolve)
        state.worker!.postMessage({ id, text } as WorkerRequest)
      })
    : new Promise(resolve => {
        if (typeof window !== 'undefined' && window.requestIdleCallback) {
          window.requestIdleCallback(() =>
            resolve(normalizeDirectiveIndentation(text))
          )
        } else {
          setTimeout(() => resolve(normalizeDirectiveIndentation(text)), 0)
        }
      })
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
    // `pid` is expected to be a string when present; cast to keep types concise
    const id = passage.properties?.pid as string | undefined
    const isNewPassage = prevPassageId.current !== id
    if (isNewPassage) {
      prevPassageId.current = id
      clearTitleOverride()
      resetDeck()
    }
    // `name` is expected to be a string when present
    const name = passage.properties?.name as string | undefined
    if (!isTitleOverridden()) {
      const storyName = storyData.name as string | undefined
      const separator =
        (storyData['title-separator'] as string | undefined) ?? ': '
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
      if (controller.signal.aborted) return
      if (!passage) {
        setContent(null)
        return
      }
      const id = passage.properties?.pid as string | undefined
      const text = passage.children
        .map((child: Content) =>
          child.type === 'text' ? (child as HastText).value : ''
        )
        .join('')
      const cache = getPassageCache()
      const shouldCache = id && canCachePassage(text)
      const cached = shouldCache ? cache.get(id) : undefined
      if (shouldCache && cached && cached.text === text) {
        setContent(cloneTree(cached.content))
        return
      }
      const normalized = await parseInWorker(text)
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
