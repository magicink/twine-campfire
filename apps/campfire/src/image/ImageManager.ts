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
   * @returns A promise resolving with the loaded image element.
   */
  load(id: string, src: string): Promise<HTMLImageElement> {
    return super.load(id, src, () => new Image(), {
      start: (img, href) => {
        img.src = href
      },
      loadEvent: 'load'
    })
  }

  /**
   * Clears cached images.
   *
   * @param id - Optional identifier of the image to clear; clears all if omitted.
   */
  clear(id?: string): void {
    if (id) {
      this.cache.delete(id)
      this.inFlight.delete(id)
      return
    }
    this.cache.clear()
    this.inFlight.clear()
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
