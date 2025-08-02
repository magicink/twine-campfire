import { useState, useEffect, useRef } from 'react'
import {
  useStoryDataStore,
  type StoryDataState
} from '@/packages/use-story-data-store'
import { useGameStore } from '@/packages/use-game-store'
import i18next from 'i18next'

const DEBUG_OPTION = 'debug' as const
const TAB_GAME = 'game' as const
const TAB_STORY = 'story' as const
const TAB_TRANSLATIONS = 'translations' as const
const TAB_ERRORS = 'errors' as const
type Tab =
  | typeof TAB_GAME
  | typeof TAB_STORY
  | typeof TAB_TRANSLATIONS
  | typeof TAB_ERRORS

export const DebugWindow = () => {
  const storyData = useStoryDataStore(
    (state: StoryDataState) => state.storyData
  )
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
  const errors = useGameStore(state => state.errors)
  const [visible, setVisible] = useState(true)
  const [minimized, setMinimized] = useState(false)
  const [tab, setTab] = useState<Tab>(TAB_GAME)
  const containerRef = useRef<HTMLDivElement>(null)

  const debugEnabled = storyData?.options === DEBUG_OPTION

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
            <button
              type='button'
              className={`flex-1 p-2 ${tab === TAB_ERRORS ? 'font-bold' : ''}`}
              onClick={e => {
                e.stopPropagation()
                setTab(TAB_ERRORS)
              }}
            >
              Errors
            </button>
          </div>
          <div className='p-2'>
            {tab === TAB_GAME ? (
              <pre className='whitespace-pre-wrap'>
                {JSON.stringify(gameData, null, 2)}
              </pre>
            ) : tab === TAB_STORY ? (
              <pre className='whitespace-pre-wrap'>
                {JSON.stringify(storyData, null, 2)}
              </pre>
            ) : tab === TAB_TRANSLATIONS ? (
              <pre className='whitespace-pre-wrap'>
                {JSON.stringify(translations, null, 2)}
              </pre>
            ) : (
              <pre className='whitespace-pre-wrap'>{errors.join('\n')}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
