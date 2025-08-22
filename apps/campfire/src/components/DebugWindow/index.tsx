import { useState, useEffect, useRef, useMemo } from 'preact/hooks'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import remarkCampfire from '@campfire/remark-campfire'
import remarkRehype from 'remark-rehype'
import rehypeCampfire from '@campfire/rehype-campfire'
import rehypeStringify from 'rehype-stringify'
import rehypeSlideText from '@campfire/utils/rehypeSlideText'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import {
  remarkHeadingStyles,
  remarkParagraphStyles
} from '@campfire/utils/remarkStyles'
import {
  useStoryDataStore,
  type StoryDataState
} from '@campfire/state/useStoryDataStore'
import { useGameStore } from '@campfire/state/useGameStore'
import i18next from 'i18next'
import type { Element, Text, Content } from 'hast'

const DEBUG_OPTION = 'debug' as const
const TAB_GAME = 'game' as const
const TAB_STORY = 'story' as const
const TAB_PASSAGE = 'passage' as const
const TAB_TRANSLATIONS = 'translations' as const
type Tab =
  | typeof TAB_GAME
  | typeof TAB_STORY
  | typeof TAB_PASSAGE
  | typeof TAB_TRANSLATIONS

/**
 * Extracts the raw text from a passage element.
 *
 * @param {Element | undefined} passage - The passage to extract text from.
 * @returns {string} The raw, unprocessed passage text.
 */
const getRawPassage = (passage: Element | undefined): string => {
  if (!passage) return ''
  return passage.children
    .map((child: Content) =>
      child.type === 'text' && typeof child.value === 'string'
        ? (child as Text).value
        : ''
    )
    .join('')
}

const DIRECTIVE_MARKER_PATTERN = '(:::[^\\n]*|:[^\\n]*|<<)'

/**
 * Normalizes directive indentation so Markdown treats directive lines the same
 * regardless of leading spaces or tabs. Strips tabs or four-or-more spaces
 * before directive markers.
 *
 * @param input - Raw passage text.
 * @returns Passage text with directive indentation normalized.
 */
const normalizeDirectiveIndentation = (input: string): string =>
  input
    .replace(new RegExp(`^\\t+(?=(${DIRECTIVE_MARKER_PATTERN}))`, 'gm'), '')
    .replace(new RegExp(`^[ ]{4,}(?=(${DIRECTIVE_MARKER_PATTERN}))`, 'gm'), '')

/**
 * Renders a debug window showing game, story, translation and passage data.
 * Also displays passage information when the debug option is enabled.
 */
export const DebugWindow = () => {
  const storyData = useStoryDataStore(
    (state: StoryDataState) => state.storyData
  )
  const passages = useStoryDataStore((state: StoryDataState) => state.passages)
  const currentPassage = useStoryDataStore((state: StoryDataState) =>
    state.getCurrentPassage()
  )
  const rawPassage = getRawPassage(currentPassage)
  const handlers = useDirectiveHandlers()
  const processor = useMemo(
    () =>
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkDirective)
        .use(remarkCampfire, { handlers })
        .use(remarkParagraphStyles)
        .use(remarkHeadingStyles)
        .use(remarkRehype)
        .use(rehypeCampfire)
        .use(rehypeSlideText)
        .use(rehypeStringify),
    [handlers]
  )
  const [jsxPassage, setJsxPassage] = useState('')
  const [translations, setTranslations] = useState<Record<string, unknown>>({})
  useEffect(() => {
    const update = () => {
      // Only update translations if i18next is initialized and store exists
      if (i18next.isInitialized && i18next.store) {
        setTranslations({ ...i18next.store.data })
      }
    }

    // If i18next is already initialized, update immediately
    if (i18next.isInitialized) {
      update()
    }

    // Listen for i18next initialization
    const handleInitialized = () => {
      update()
    }

    i18next.on('initialized', handleInitialized)
    i18next.on('added', update)
    i18next.on('removed', update)
    return () => {
      i18next.off('initialized', handleInitialized)
      i18next.off('added', update)
      i18next.off('removed', update)
    }
  }, [])
  const gameData = useGameStore(state => state.gameData)
  const [visible, setVisible] = useState(true)
  const [minimized, setMinimized] = useState(false)
  const [tab, setTab] = useState<Tab>(TAB_GAME)
  const containerRef = useRef<HTMLDivElement>(null)

  const debugEnabled = storyData?.options === DEBUG_OPTION

  /**
   * Copies the raw passage text to the clipboard.
   *
   * @returns {void}
   */
  const handleCopyRaw = (): void => {
    void navigator.clipboard?.writeText(rawPassage)
  }

  /**
   * Copies the processed passage markup to the clipboard.
   *
   * @returns {void}
   */
  const handleCopyJsx = (): void => {
    void navigator.clipboard?.writeText(jsxPassage)
  }

  useEffect(() => {
    const controller = new AbortController()
    ;(async () => {
      if (controller.signal.aborted) return
      if (!rawPassage) {
        setJsxPassage('')
        return
      }
      const normalized = normalizeDirectiveIndentation(rawPassage)
      const file = await processor.process(normalized)
      if (controller.signal.aborted) return
      setJsxPassage(String(file.value))
    })()
    return () => controller.abort()
  }, [rawPassage, processor])

  useEffect(() => {
    if (debugEnabled && visible) {
      containerRef.current?.focus()
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setVisible(false)
        }
      }
      window.addEventListener('keydown', handleKey)
      return () => {
        window.removeEventListener('keydown', handleKey)
      }
    }
  }, [debugEnabled, visible])

  if (!debugEnabled || !visible) return null

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      role='dialog'
      aria-labelledby='debug-window-title'
      onClick={() => setMinimized(m => !m)}
      className={`fixed right-0 top-0 w-80 bg-white text-black shadow-lg text-xs overflow-y-auto ${
        minimized ? '' : 'bottom-0'
      }`}
    >
      <div className='flex items-center justify-between p-2 border-b'>
        <span id='debug-window-title' className='font-bold'>
          Debug
        </span>
        <div className='space-x-2'>
          <button
            type='button'
            aria-expanded={!minimized}
            onClick={e => {
              e.stopPropagation()
              setMinimized(m => !m)
            }}
          >
            {minimized ? 'Expand' : 'Minimize'}
          </button>
        </div>
      </div>
      {!minimized && (
        <div>
          <div className='flex border-b'>
            <button
              type='button'
              className={`flex-1 p-2 ${tab === TAB_GAME ? 'font-bold' : ''}`}
              onClick={e => {
                e.stopPropagation()
                setTab(TAB_GAME)
              }}
            >
              Game Data
            </button>
            <button
              type='button'
              className={`flex-1 p-2 ${tab === TAB_STORY ? 'font-bold' : ''}`}
              onClick={e => {
                e.stopPropagation()
                setTab(TAB_STORY)
              }}
            >
              Story Data
            </button>
            <button
              type='button'
              className={`flex-1 p-2 ${tab === TAB_PASSAGE ? 'font-bold' : ''}`}
              onClick={e => {
                e.stopPropagation()
                setTab(TAB_PASSAGE)
              }}
            >
              Passage
            </button>
            <button
              type='button'
              className={`flex-1 p-2 ${
                tab === TAB_TRANSLATIONS ? 'font-bold' : ''
              }`}
              onClick={e => {
                e.stopPropagation()
                setTab(TAB_TRANSLATIONS)
              }}
            >
              Translations
            </button>
          </div>
          <div className='p-2'>
            {tab === TAB_GAME ? (
              <pre className='whitespace-pre-wrap'>
                {JSON.stringify(gameData, null, 2)}
              </pre>
            ) : tab === TAB_STORY ? (
              <div>
                <pre className='whitespace-pre-wrap'>
                  {JSON.stringify(storyData, null, 2)}
                </pre>
                <ul className='mt-2 list-disc pl-4'>
                  {passages.map(p => {
                    const pid = String(p.properties?.pid ?? '')
                    const name = String(p.properties?.name ?? '')
                    return <li key={pid || name}>{name || pid}</li>
                  })}
                </ul>
              </div>
            ) : tab === TAB_PASSAGE ? (
              <div className='space-y-4'>
                <div>
                  <button
                    type='button'
                    data-testid='copy-raw'
                    onClick={e => {
                      e.stopPropagation()
                      handleCopyRaw()
                    }}
                  >
                    Copy Raw
                  </button>
                  <pre className='whitespace-pre-wrap'>{rawPassage}</pre>
                </div>
                <div>
                  <button
                    type='button'
                    data-testid='copy-jsx'
                    onClick={e => {
                      e.stopPropagation()
                      handleCopyJsx()
                    }}
                  >
                    Copy JSX
                  </button>
                  <pre className='whitespace-pre-wrap'>{jsxPassage}</pre>
                </div>
              </div>
            ) : tab === TAB_TRANSLATIONS ? (
              <pre className='whitespace-pre-wrap'>
                {JSON.stringify(translations, null, 2)}
              </pre>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
