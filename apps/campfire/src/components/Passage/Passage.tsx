import { cloneElement, type ComponentChild, type VNode } from 'preact'
import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import type { Text as HastText, Content } from 'hast'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import {
  remarkHeadingStyles,
  remarkParagraphStyles
} from '@campfire/utils/remarkStyles'
import { createMarkdownProcessor } from '@campfire/utils/createMarkdownProcessor'
import { scanDirectives } from '@campfire/utils/scanDirectives'
import { shouldStripDirectiveIndent } from '@campfire/utils/shouldStripDirectiveIndent'
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
 * Normalizes directive indentation so Markdown treats directive lines the same
 * regardless of leading spaces or tabs. Uses {@link scanDirectives} to walk the
 * source once and remove tabs or four-or-more spaces before directive markers.
 *
 * @param input - Raw passage text.
 * @returns Passage text with directive indentation normalized.
 */
const normalizeDirectiveIndentation = (input: string): string => {
  let output = ''
  let lineStart = 0
  for (const token of scanDirectives(input)) {
    if (token.type === 'text') {
      output += token.value
    } else {
      const indent = output.slice(lineStart).match(/^[\t ]*/)?.[0] ?? ''
      if (shouldStripDirectiveIndent(indent))
        output = output.slice(0, lineStart)
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
 * Lazily initializes a Web Worker for heavy passage preprocessing.
 * Ensures setup only occurs in browser environments to avoid SSR crashes.
 *
 * @returns Nothing.
 */
let worker: Worker | null = null
const pending = new Map<number, (r: string) => void>()
let nextId = 0

/**
 * Caches compiled passages to avoid repeated Markdown processing.
 * Stores raw passage text so updates with the same id but different content
 * invalidate the cache.
 */
const passageCache = new Map<
  string,
  { text: string; content: ComponentChild }
>()

const initWorker = () => {
  if (worker || typeof window === 'undefined' || typeof Worker === 'undefined')
    return

  worker = new Worker(new URL('./directiveWorker.ts', import.meta.url), {
    type: 'module'
  })

  window.addEventListener('beforeunload', () => {
    worker?.terminate()
  })

  worker.onmessage = event => {
    const { id, result } = event.data as WorkerResponse
    const resolver = pending.get(id)
    if (resolver) {
      resolver(result)
      pending.delete(id)
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
  initWorker()

  return worker
    ? new Promise(resolve => {
        const id = nextId++
        pending.set(id, resolve)
        worker!.postMessage({ id, text } as WorkerRequest)
      })
    : new Promise(resolve => {
        if (
          typeof window !== 'undefined' &&
          typeof window.requestIdleCallback === 'function'
        )
          window.requestIdleCallback(() =>
            resolve(normalizeDirectiveIndentation(text))
          )
        else setTimeout(() => resolve(normalizeDirectiveIndentation(text)), 0)
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
      if (controller.signal.aborted) return
      if (!passage) {
        setContent(null)
        return
      }
      const id =
        typeof passage.properties?.pid === 'string'
          ? passage.properties.pid
          : undefined
      const text = passage.children
        .map((child: Content) =>
          child.type === 'text' && typeof child.value === 'string'
            ? (child as HastText).value
            : ''
        )
        .join('')
      const shouldCache = id && canCachePassage(text)
      const cached = shouldCache ? passageCache.get(id) : undefined
      if (shouldCache && cached && cached.text === text) {
        setContent(cloneTree(cached.content))
        return
      }
      const normalized = await parseInWorker(text)
      if (controller.signal.aborted) return
      const file = await processor.process(normalized)
      if (controller.signal.aborted) return
      const result = file.result as ComponentChild
      if (shouldCache) passageCache.set(id as string, { text, content: result })
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
