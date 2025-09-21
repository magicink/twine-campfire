import { AudioManager } from '@campfire/audio/AudioManager'
import { ImageManager } from '@campfire/image/ImageManager'
import type { DirectiveHandler } from '@campfire/remark-campfire'
import {
  extractAttributes,
  hasLabel,
  removeNode,
  runWithIdOrSrc
} from '@campfire/utils/directiveUtils'
import { requireLeafDirective } from '@campfire/utils/directiveHandlerUtils'

/**
 * Context required to create media directive handlers.
 */
export interface MediaHandlerContext {
  /** Records an error message. */
  addError: (msg: string) => void
}

/**
 * Creates handlers for media directives (`:preloadImage`, `:preloadAudio`, `:sound`, `:bgm`, `:volume`).
 *
 * @param ctx - Context providing utilities such as error recording.
 * @returns An object containing media directive handlers.
 */
export const createMediaHandlers = (ctx: MediaHandlerContext) => {
  const { addError } = ctx
  const audio = AudioManager.getInstance()
  const images = ImageManager.getInstance()

  /**
   * Creates a preload handler for media directives.
   *
   * @param loader - Asset-specific loader invoked with the resolved id and src.
   * @param errorMessage - Error message recorded when validation fails.
   * @returns Directive handler that removes the processed node.
   */
  const createPreloadHandler = (
    loader: (id: string, src: string) => void | Promise<unknown>,
    errorMessage: string
  ): DirectiveHandler => {
    return (directive, parent, index) => {
      const invalid = requireLeafDirective(directive, parent, index, addError)
      if (invalid !== undefined) return invalid
      const { attrs } = extractAttributes(directive, parent, index, {
        id: { type: 'string' },
        src: { type: 'string' }
      })
      const id = hasLabel(directive) ? directive.label : attrs.id
      const src = attrs.src
      if (id && src) {
        void loader(id, src)
      } else {
        addError(errorMessage)
      }
      return removeNode(parent, index)
    }
  }

  /**
   * Preloads an audio track into the AudioManager cache.
   *
   * @param directive - The directive node being processed.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within the parent.
   * @returns The index of the removed node.
   */
  const handlePreloadAudio = createPreloadHandler(
    (id, src) => audio.load(id, src),
    'preloadAudio directive requires an id/label and src'
  )

  /**
   * Preloads an image asset into cache.
   *
   * @param directive - The directive node being processed.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within the parent.
   * @returns The index of the removed node.
   */
  const handlePreloadImage = createPreloadHandler(
    (id, src) => images.load(id, src),
    'preloadImage directive requires an id/label and src'
  )

  /**
   * Plays a sound effect or preloaded audio track.
   *
   * @param directive - The directive node being processed.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within the parent.
   * @returns The index of the removed node.
   */
  const handleSound: DirectiveHandler = (directive, parent, index) => {
    const invalid = requireLeafDirective(directive, parent, index, addError)
    if (invalid !== undefined) return invalid
    const { attrs } = extractAttributes(directive, parent, index, {
      id: { type: 'string' },
      src: { type: 'string' },
      volume: { type: 'number' },
      delay: { type: 'number' }
    })
    const volume = typeof attrs.volume === 'number' ? attrs.volume : undefined
    const delay = typeof attrs.delay === 'number' ? attrs.delay : undefined
    runWithIdOrSrc(
      directive,
      attrs,
      (id, opts) => audio.playSfx(id, opts),
      { volume, delay },
      'sound directive requires id or src',
      addError
    )
    return removeNode(parent, index)
  }

  /**
   * Controls background music playback, allowing start, stop and fade.
   *
   * @param directive - The directive node being processed.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within the parent.
   * @returns The index of the removed node.
   */
  const handleBgm: DirectiveHandler = (directive, parent, index) => {
    const invalid = requireLeafDirective(directive, parent, index, addError)
    if (invalid !== undefined) return invalid
    const { attrs } = extractAttributes(directive, parent, index, {
      id: { type: 'string' },
      src: { type: 'string' },
      stop: { type: 'boolean' },
      volume: { type: 'number' },
      loop: { type: 'boolean' },
      fade: { type: 'number' }
    })
    const stop = attrs.stop === true
    const volume = typeof attrs.volume === 'number' ? attrs.volume : undefined
    const loop = attrs.loop === false ? false : true
    const fade = typeof attrs.fade === 'number' ? attrs.fade : undefined
    if (stop) {
      audio.stopBgm(fade)
    } else {
      runWithIdOrSrc(
        directive,
        attrs,
        (id, opts) => audio.playBgm(id, opts),
        { volume, loop, fade },
        'bgm directive requires id or src',
        addError
      )
    }
    return removeNode(parent, index)
  }

  /**
   * Adjusts global audio volume levels for BGM and sound effects.
   *
   * @param directive - The directive node being processed.
   * @param parent - Parent node containing the directive.
   * @param index - Index of the directive within the parent.
   * @returns The index of the removed node.
   */
  const handleVolume: DirectiveHandler = (directive, parent, index) => {
    const invalid = requireLeafDirective(directive, parent, index, addError)
    if (invalid !== undefined) return invalid
    const { attrs } = extractAttributes(directive, parent, index, {
      bgm: { type: 'number' },
      sfx: { type: 'number' }
    })
    if (typeof attrs.bgm === 'number') {
      audio.setBgmVolume(attrs.bgm)
    }
    if (typeof attrs.sfx === 'number') {
      audio.setSfxVolume(attrs.sfx)
    }
    return removeNode(parent, index)
  }

  return {
    preloadAudio: handlePreloadAudio,
    preloadImage: handlePreloadImage,
    sound: handleSound,
    bgm: handleBgm,
    volume: handleVolume
  }
}
