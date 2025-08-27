import { getBaseUrl } from '@campfire/utils/core'

export class ImageManager {
  private static instance: ImageManager
  private cache: Map<string, HTMLImageElement> = new Map()

  /**
   * Retrieves the singleton instance of the ImageManager.
   *
   * @returns The ImageManager instance.
   */
  static getInstance(): ImageManager {
    if (!this.instance) this.instance = new ImageManager()
    return this.instance
  }

  /**
   * Preloads an image and caches it by id.
   *
   * @param id - Unique identifier for the image.
   * @param src - Source URL of the image.
   * @returns A promise that resolves when the image is loaded.
   */
  load(id: string, src: string): Promise<void> {
    if (this.cache.has(id)) return Promise.resolve()
    return new Promise((resolve, reject) => {
      const img = new Image()
      const cleanup = () => {
        img.onload = null
        img.onerror = null
      }
      img.onload = () => {
        cleanup()
        this.cache.set(id, img)
        resolve()
      }
      img.onerror = err => {
        cleanup()
        reject(err)
      }
      try {
        img.src = new URL(src, getBaseUrl()).href
      } catch (err) {
        cleanup()
        console.error(`Invalid image source: ${src}`, err)
        reject(err as Error)
        return
      }
    })
  }

  /**
   * Retrieves a cached image by id.
   *
   * @param id - Identifier of the image.
   * @returns The cached image element, if available.
   */
  get(id: string): HTMLImageElement | undefined {
    return this.cache.get(id)
  }
}
