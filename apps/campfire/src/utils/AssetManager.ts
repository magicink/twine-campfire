import { getBaseUrl } from '@campfire/utils/core'

/**
 * Generic asset manager providing singleton access, caching, and URL resolution.
 *
 * @typeParam T - Type of asset handled by the manager.
 */
export abstract class AssetManager<T> {
  private static instances = new Map<Function, AssetManager<any>>()

  /** Cache of loaded assets keyed by identifier. */
  protected cache: Map<string, T> = new Map()

  /**
   * Retrieves the singleton instance for the derived manager.
   *
   * @returns The singleton instance of the manager.
   */
  static getInstance<TManager extends AssetManager<any>>(
    this: new () => TManager
  ): TManager {
    let instance = AssetManager.instances.get(this) as TManager | undefined
    if (!instance) {
      instance = new this()
      AssetManager.instances.set(this, instance)
    }
    return instance
  }

  /**
   * Resolves an asset source against the application base URL.
   *
   * @param src - Source string to resolve.
   * @returns Resolved absolute URL string.
   */
  protected resolve = (src: string): string => new URL(src, getBaseUrl()).href

  /**
   * Retrieves a cached asset or creates one using the provided factory.
   *
   * @param id - Cache key for the asset.
   * @param src - Optional source string for the asset.
   * @param factory - Factory creating the asset from a resolved URL.
   * @returns The cached or newly created asset, or undefined if resolution fails.
   */
  protected getOrCreate = (
    id: string,
    src: string | undefined,
    factory: (href: string) => T
  ): T | undefined => {
    let asset = this.cache.get(id)
    if (asset) return asset
    const ref = src ?? id
    if (!ref) return undefined
    let href: string
    try {
      href = this.resolve(ref)
    } catch {
      console.error(`Invalid asset source: ${ref}`)
      return undefined
    }
    asset = factory(href)
    this.cache.set(id, asset)
    return asset
  }
}

export default AssetManager
