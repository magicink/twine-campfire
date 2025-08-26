import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test'
import { render, screen } from '@testing-library/preact'
import { LoadingScreen } from '@campfire/components/LoadingScreen'
import { AudioManager } from '@campfire/audio/AudioManager'
import { ImageManager } from '@campfire/image/ImageManager'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'

beforeEach(() => {
  useStoryDataStore.setState({ currentPassageId: undefined })
})

afterEach(() => {
  useStoryDataStore.setState({
    storyData: {},
    passages: [],
    currentPassageId: undefined
  })
})

describe('LoadingScreen', () => {
  it('shows progress and advances to target passage', async () => {
    const audio = AudioManager.getInstance()
    const images = ImageManager.getInstance()
    const audioSpy = spyOn(audio, 'load').mockImplementation(() =>
      Promise.resolve()
    )
    let resolveImage: () => void = () => {}
    const imageSpy = spyOn(images, 'load').mockImplementation(
      () =>
        new Promise(res => {
          resolveImage = res
        })
    )

    render(
      <LoadingScreen
        assets={[
          { type: 'audio', id: 'click', src: 'click.wav' },
          { type: 'image', id: 'logo', src: 'logo.png' }
        ]}
        targetPassage='Intro'
      />
    )

    await new Promise(r => setTimeout(r, 0))
    expect(screen.getByTestId('loading-bar-fill').style.width).toBe('50%')
    resolveImage()
    await new Promise(r => setTimeout(r, 0))
    expect(screen.getByTestId('loading-bar-fill').style.width).toBe('100%')
    expect(useStoryDataStore.getState().currentPassageId).toBe('Intro')

    audioSpy.mockRestore()
    imageSpy.mockRestore()
  })
})
