import { useEffect, useRef, useState } from 'preact/hooks'
import { AudioManager } from '@campfire/audio/AudioManager'
import { ImageManager } from '@campfire/image/ImageManager'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'

interface Asset {
  type: 'image' | 'audio'
  id: string
  src: string
}

/**
 * Displays a loading bar while preloading assets.
 *
 * @param assets - List of assets to preload.
 * @param targetPassage - Passage id to navigate to when complete.
 * @returns Loading screen component.
 */
export const LoadingScreen = ({
  assets,
  targetPassage
}: {
  assets: Asset[]
  targetPassage: string
}) => {
  const [progress, setProgress] = useState(0)
  const setCurrentPassage = useStoryDataStore(state => state.setCurrentPassage)
  const loadedRef = useRef(0)

  useEffect(() => {
    loadedRef.current = 0
    const total = assets.length
    const audio = AudioManager.getInstance()
    const images = ImageManager.getInstance()

    if (total === 0) {
      setProgress(100)
      return
    }

    assets.forEach(({ type, id, src }) => {
      const loader =
        type === 'audio' ? audio.load(id, src) : images.load(id, src)

      loader
        .catch((err: unknown) => console.error('Failed to preload', id, err))
        .finally(() => {
          loadedRef.current += 1
          setProgress(Math.floor((loadedRef.current / total) * 100))
        })
    })
  }, [assets])

  useEffect(() => {
    if (progress >= 100) {
      setCurrentPassage(targetPassage)
    }
  }, [progress, setCurrentPassage, targetPassage])

  return (
    <div className='campfire-loading-screen' data-testid='loading-screen'>
      <div
        className='campfire-loading-bar'
        role='progressbar'
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-labelledby='campfire-loading-label'
        data-testid='loading-bar'
      >
        <div
          className='campfire-loading-bar-fill'
          style={{ width: `${progress}%` }}
          data-testid='loading-bar-fill'
        />
      </div>
      <p id='campfire-loading-label'>{progress}%</p>
    </div>
  )
}
