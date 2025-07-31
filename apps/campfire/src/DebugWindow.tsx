import { useState, useEffect, useRef } from 'react'
import {
  useStoryDataStore,
  type StoryDataState
} from '@/packages/use-story-data-store'
import { useGameStore } from '@/packages/use-game-store'

const DEBUG_OPTION = 'debug' as const
const TAB_GAME = 'game' as const
const TAB_STORY = 'story' as const
type Tab = typeof TAB_GAME | typeof TAB_STORY

export const DebugWindow = () => {
  const storyData = useStoryDataStore(
    (state: StoryDataState) => state.storyData
  )
  const passages = useStoryDataStore(state => state.passages)
  const currentPassageId = useStoryDataStore(state => state.currentPassageId)
  const gameData = useGameStore(state => state.gameData)
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
      className={`fixed right-0 top-0 ${
        minimized ? '' : 'bottom-0 overflow-y-auto'
      } w-80 bg-white text-black shadow-lg text-xs`}
    >
      <div className='flex items-center justify-between p-2 border-b'>
        <span id='debug-window-title' className='font-bold'>
          Debug
        </span>
        <div className='space-x-2'>
          <button
            type='button'
            aria-expanded={!minimized}
            onClick={() => setMinimized(m => !m)}
          >
            {minimized ? 'Expand' : 'Minimize'}
          </button>
          <button
            type='button'
            aria-label='Close debug window'
            onClick={() => setVisible(false)}
          >
            Close
          </button>
        </div>
      </div>
      {!minimized && (
        <div>
          <div className='flex border-b'>
            <button
              type='button'
              className={`flex-1 p-2 ${tab === TAB_GAME ? 'font-bold' : ''}`}
              onClick={() => setTab(TAB_GAME)}
            >
              Game Data
            </button>
            <button
              type='button'
              className={`flex-1 p-2 ${tab === TAB_STORY ? 'font-bold' : ''}`}
              onClick={() => setTab(TAB_STORY)}
            >
              Story Data
            </button>
          </div>
          <div className='p-2'>
            {tab === TAB_GAME ? (
              <pre className='whitespace-pre-wrap'>
                {JSON.stringify(gameData, null, 2)}
              </pre>
            ) : (
              <div className='space-y-2'>
                <pre className='whitespace-pre-wrap'>
                  {JSON.stringify(storyData, null, 2)}
                </pre>
                <div>
                  <p className='font-bold'>Passages</p>
                  <ul className='list-disc pl-4'>
                    {passages.map(p => {
                      const id = String(p.properties?.pid ?? p.properties?.name)
                      const name = String(
                        p.properties?.name ?? p.properties?.pid
                      )
                      const isCurrent =
                        currentPassageId === id || currentPassageId === name
                      return (
                        <li key={id} className={isCurrent ? 'font-bold' : ''}>
                          {name}
                          {isCurrent ? ' (current)' : ''}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
