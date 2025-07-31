import { useState } from 'react'
import {
  useStoryDataStore,
  type StoryDataState
} from '@/packages/use-story-data-store'
import { useGameStore } from '@/packages/use-game-store'

export const DebugWindow = () => {
  const storyData = useStoryDataStore(
    (state: StoryDataState) => state.storyData
  )
  const gameData = useGameStore(state => state.gameData)
  const [visible, setVisible] = useState(true)
  const [minimized, setMinimized] = useState(false)
  const [tab, setTab] = useState<'game' | 'story'>('game')

  const options = (storyData?.options ?? {}) as Record<string, unknown>
  const debugEnabled = options.debug === true

  if (!debugEnabled || !visible) return null

  return (
    <div className='fixed right-0 top-0 bottom-0 w-80 bg-white text-black shadow-lg text-xs overflow-y-auto'>
      <div className='flex items-center justify-between p-2 border-b'>
        <span className='font-bold'>Debug</span>
        <div className='space-x-2'>
          <button type='button' onClick={() => setMinimized(m => !m)}>
            {minimized ? 'Expand' : 'Minimize'}
          </button>
          <button type='button' onClick={() => setVisible(false)}>
            Close
          </button>
        </div>
      </div>
      {!minimized && (
        <div>
          <div className='flex border-b'>
            <button
              type='button'
              className={`flex-1 p-2 ${tab === 'game' ? 'font-bold' : ''}`}
              onClick={() => setTab('game')}
            >
              Game Data
            </button>
            <button
              type='button'
              className={`flex-1 p-2 ${tab === 'story' ? 'font-bold' : ''}`}
              onClick={() => setTab('story')}
            >
              Story Data
            </button>
          </div>
          <div className='p-2'>
            {tab === 'game' ? (
              <pre className='whitespace-pre-wrap'>
                {JSON.stringify(gameData, null, 2)}
              </pre>
            ) : (
              <pre className='whitespace-pre-wrap'>
                {JSON.stringify(storyData, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
