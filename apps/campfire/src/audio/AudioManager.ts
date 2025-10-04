import { AssetManager } from '@campfire/utils/AssetManager'

/**
 * Manages loading and playback of audio assets.
 */
export class AudioManager extends AssetManager<HTMLAudioElement> {
  private bgm?: HTMLAudioElement
  private globalSfxVolume = 1
  private globalBgmVolume = 1
  private bgmBaseVolume = 1

  /**
   * Creates a new audio element with automatic preloading.
   *
   * @returns A new HTMLAudioElement.
   */
  private createAudio = (): HTMLAudioElement => {
    const audio = new Audio()
    audio.preload = 'auto'
    return audio
  }

  /**
   * Retrieves a cached audio element or creates one from the given source.
   *
   * @param id - Identifier for the audio track.
   * @param source - Optional source URL for the track.
   * @returns The audio element or undefined if no source was available.
   */
  private getOrCreateAudio = (
    id: string,
    source?: string
  ): HTMLAudioElement | undefined =>
    this.getOrCreate(id, source, href => {
      const audio = this.createAudio()
      audio.src = href
      return audio
    })

  /**
   * Preloads an audio file. If the id already exists, it will be ignored.
   *
   * @param id - Unique identifier for the audio file.
   * @param src - Source URL of the audio file.
   * @returns A promise that resolves when the audio is loaded.
   */
  load(id: string, src: string): Promise<HTMLAudioElement> {
    return super.load(id, src, this.createAudio, {
      start: (audio, href) => {
        audio.src = href
        audio.load()
      },
      loadEvent: 'canplaythrough'
    })
  }

  /**
   * Plays or changes the current background music. A previous track will fade
   * out if fade duration is provided.
   *
   * @param id - Identifier for the track.
   * @param opts - Optional playback settings.
   */
  playBgm(
    id: string,
    opts: { src?: string; volume?: number; loop?: boolean; fade?: number } = {}
  ): void {
    const base = this.getOrCreateAudio(id, opts.src)
    if (!base) return
    const audio = base.cloneNode(true) as HTMLAudioElement

    if (this.bgm) {
      this.stopBgm(opts.fade)
    }

    this.bgm = audio
    this.bgmBaseVolume = opts.volume ?? 1
    audio.loop = opts.loop ?? true
    audio.volume = this.bgmBaseVolume * this.globalBgmVolume
    void audio.play()
  }

  /**
   * Stops the current background music with an optional fade out.
   *
   * @param fadeMs - Duration of fade in milliseconds.
   */
  stopBgm(fadeMs?: number): void {
    if (!this.bgm) return
    const current = this.bgm
    if (fadeMs && fadeMs > 0) {
      const startVol = current.volume
      const step = 50
      let elapsed = 0
      const timer = setInterval(() => {
        elapsed += step
        current.volume = Math.max(0, startVol * (1 - elapsed / fadeMs))
        if (elapsed >= fadeMs) {
          clearInterval(timer)
          current.pause()
          current.currentTime = 0
        }
      }, step)
    } else {
      current.pause()
      current.currentTime = 0
    }
    this.bgm = undefined
    this.bgmBaseVolume = 1
  }

  /**
   * Sets the global BGM volume and applies it to the current track.
   *
   * @param volume - Volume level from 0 to 1.
   */
  setBgmVolume(volume: number): void {
    this.globalBgmVolume = volume
    if (this.bgm) this.bgm.volume = this.bgmBaseVolume * volume
  }

  /**
   * Sets the global SFX volume.
   *
   * @param volume - Volume level from 0 to 1.
   */
  setSfxVolume(volume: number): void {
    this.globalSfxVolume = volume
  }

  /**
   * Plays a sound effect by id or from a provided source.
   *
   * @param id - Identifier for the sound effect.
   * @param opts - Additional playback options.
   */
  playSfx(
    id: string,
    opts: { src?: string; volume?: number; delay?: number } = {}
  ): void {
    const base = this.getOrCreateAudio(id, opts.src)
    if (!base) return
    const audio = base.cloneNode(true) as HTMLAudioElement
    audio.volume = (opts.volume ?? 1) * this.globalSfxVolume
    const start = () => {
      void audio.play()
    }
    if (opts.delay && opts.delay > 0) {
      setTimeout(start, opts.delay)
    } else {
      start()
    }
  }
}
