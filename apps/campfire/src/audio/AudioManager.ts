export class AudioManager {
  private static instance: AudioManager
  private bgm?: HTMLAudioElement
  private bgmName?: string
  private sfxMap: Map<string, HTMLAudioElement> = new Map()
  private globalSfxVolume = 1
  private globalBgmVolume = 1

  /**
   * Retrieves the singleton instance of the AudioManager.
   *
   * @returns The AudioManager instance.
   */
  static getInstance(): AudioManager {
    if (!this.instance) this.instance = new AudioManager()
    return this.instance
  }

  /**
   * Preloads an audio file. If the id already exists, it will be ignored.
   *
   * @param id - Unique identifier for the audio file.
   * @param src - Source URL of the audio file.
   */
  load(id: string, src: string): void {
    if (this.sfxMap.has(id)) return
    const audio = new Audio(src)
    audio.preload = 'auto'
    this.sfxMap.set(id, audio)
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
    let audio: HTMLAudioElement | undefined
    if (this.sfxMap.has(id)) {
      audio = this.sfxMap.get(id)!.cloneNode(true) as HTMLAudioElement
    } else if (opts.src) {
      audio = new Audio(opts.src)
      audio.preload = 'auto'
      this.sfxMap.set(id, audio)
    }
    if (!audio) return

    if (this.bgm) {
      this.stopBgm(opts.fade)
    }

    this.bgm = audio
    this.bgmName = id
    audio.loop = opts.loop ?? true
    audio.volume = (opts.volume ?? 1) * this.globalBgmVolume
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
    this.bgmName = undefined
  }

  /**
   * Sets the global BGM volume and applies it to the current track.
   *
   * @param volume - Volume level from 0 to 1.
   */
  setBgmVolume(volume: number): void {
    this.globalBgmVolume = volume
    if (this.bgm) this.bgm.volume = volume
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
    let base: HTMLAudioElement | undefined
    if (this.sfxMap.has(id)) {
      base = this.sfxMap.get(id)!
    } else if (opts.src) {
      base = new Audio(opts.src)
      base.preload = 'auto'
      this.sfxMap.set(id, base)
    }
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
