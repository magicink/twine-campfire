import { AssetManager } from '@campfire/utils/AssetManager'

/**
 * Manages image asset loading and caching.
 */
export class ImageManager extends AssetManager<HTMLImageElement> {
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
        img.src = this.resolve(src)
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
