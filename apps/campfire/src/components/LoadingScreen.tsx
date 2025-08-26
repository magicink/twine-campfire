import { useEffect, useState } from 'preact/hooks'
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

  useEffect(() => {
    let loaded = 0
    const total = assets.length
    const audio = AudioManager.getInstance()
    const images = ImageManager.getInstance()

    if (total === 0) {
      setProgress(100)
      return
    }

    assets.forEach(({ type, id, src }) => {
      let loader: Promise<void>
      if (type === 'audio') {
        audio.load(id, src)
        loader = Promise.resolve()
      } else {
        loader = images.load(id, src)
      }
      loader
        .catch((err: unknown) => console.error('Failed to preload', id, err))
        .finally(() => {
          loaded += 1
          setProgress(Math.floor((loaded / total) * 100))
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
      <div className='campfire-loading-bar'>
        <div
          className='campfire-loading-bar-fill'
          style={{ width: `${progress}%` }}
          data-testid='loading-bar-fill'
        />
      </div>
      <p>{progress}%</p>
      {progress >= 100 && (
        <button
          type='button'
          className='campfire-loading-continue'
          data-testid='loading-continue'
          onClick={() => setCurrentPassage(targetPassage)}
        >
          Click to continue
        </button>
      )}
    </div>
  )
}
