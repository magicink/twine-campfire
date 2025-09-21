import { AudioManager } from '@campfire/audio/AudioManager'
import { ImageManager } from '@campfire/image/ImageManager'
import type { Parent, RootContent } from 'mdast'
import type { Properties } from 'hast'
import type { DirectiveHandler } from '@campfire/remark-campfire'
import {
  type ExtractedAttrs,
  extractAttributes,
  hasLabel,
  removeNode,
  replaceWithIndentation,
  runWithIdOrSrc
} from '@campfire/utils/directiveUtils'
import {
  applyAdditionalAttributes,
  ensureParentIndex,
  interpolateAttrs,
  mergeAttrs,
  requireLeafDirective
} from '@campfire/utils/directiveHandlerUtils'

const SLIDE_ASSET_SHARED_EXCLUDES = [
  'x',
  'y',
  'w',
  'h',
  'z',
  'rotate',
  'scale',
  'anchor',
  'className',
  'layerClassName',
  'style',
  'id',
  'layerId',
  'from'
] as const

const embedSchema = {
  x: { type: 'number' },
  y: { type: 'number' },
  w: { type: 'number' },
  h: { type: 'number' },
  z: { type: 'number' },
  rotate: { type: 'number' },
  scale: { type: 'number' },
  anchor: { type: 'string' },
  src: { type: 'string', required: true },
  allow: { type: 'string' },
  referrerPolicy: { type: 'string' },
  allowFullScreen: { type: 'boolean' },
  style: { type: 'string' },
  className: { type: 'string' },
  layerClassName: { type: 'string' },
  id: { type: 'string' },
  layerId: { type: 'string' },
  from: { type: 'string', expression: false }
} as const

const imageSchema = {
  x: { type: 'number' },
  y: { type: 'number' },
  w: { type: 'number' },
  h: { type: 'number' },
  z: { type: 'number' },
  rotate: { type: 'number' },
  scale: { type: 'number' },
  anchor: { type: 'string' },
  src: { type: 'string', required: true },
  alt: { type: 'string' },
  style: { type: 'string' },
  className: { type: 'string' },
  layerClassName: { type: 'string' },
  id: { type: 'string' },
  layerId: { type: 'string' },
  from: { type: 'string', expression: false }
} as const

const shapeSchema = {
  x: { type: 'number' },
  y: { type: 'number' },
  w: { type: 'number' },
  h: { type: 'number' },
  z: { type: 'number' },
  rotate: { type: 'number' },
  scale: { type: 'number' },
  anchor: { type: 'string' },
  type: { type: 'string', required: true },
  points: { type: 'string' },
  x1: { type: 'number' },
  y1: { type: 'number' },
  x2: { type: 'number' },
  y2: { type: 'number' },
  stroke: { type: 'string' },
  strokeWidth: { type: 'number' },
  fill: { type: 'string' },
  radius: { type: 'number' },
  shadow: { type: 'boolean' },
  className: { type: 'string' },
  layerClassName: { type: 'string' },
  style: { type: 'string' },
  id: { type: 'string' },
  layerId: { type: 'string' },
  from: { type: 'string', expression: false }
} as const

type EmbedAttrs = ExtractedAttrs<typeof embedSchema>
type ImageAttrs = ExtractedAttrs<typeof imageSchema>
type ShapeAttrs = ExtractedAttrs<typeof shapeSchema> & Record<string, unknown>

type SlideAssetCommonAttrs = {
  x?: number
  y?: number
  w?: number
  h?: number
  z?: number
  rotate?: number
  scale?: number
  anchor?: string
  className?: string
  layerClassName?: string
  style?: string
  id?: string
  layerId?: string
}

const buildSlideAssetProps = <
  Attrs extends SlideAssetCommonAttrs & Record<string, unknown>
>(
  attrs: Attrs,
  directiveKeys: readonly string[]
): { props: Record<string, unknown>; exclude: readonly string[] } => {
  const props: Record<string, unknown> = {}
  if (typeof attrs.x === 'number') props.x = attrs.x
  if (typeof attrs.y === 'number') props.y = attrs.y
  if (typeof attrs.w === 'number') props.w = attrs.w
  if (typeof attrs.h === 'number') props.h = attrs.h
  if (typeof attrs.z === 'number') props.z = attrs.z
  if (typeof attrs.rotate === 'number') props.rotate = attrs.rotate
  if (typeof attrs.scale === 'number') props.scale = attrs.scale
  if (attrs.anchor) props.anchor = attrs.anchor
  if (attrs.className) props.className = attrs.className
  if (attrs.layerClassName) props.layerClassName = attrs.layerClassName
  if (attrs.style) props.style = attrs.style
  if (attrs.id) props.id = attrs.id
  if (attrs.layerId) props.layerId = attrs.layerId
  return {
    props,
    exclude: [...SLIDE_ASSET_SHARED_EXCLUDES, ...directiveKeys]
  }
}

export interface MediaHandlerContext {
  addError: (msg: string) => void
  getGameData: () => Record<string, unknown>
  getPreset: <T>(type: string, name: string) => T | undefined
}

export const createMediaHandlers = (ctx: MediaHandlerContext) => {
  const { addError, getGameData, getPreset } = ctx
  const audio = AudioManager.getInstance()
  const images = ImageManager.getInstance()

  const handlePreloadAudio: DirectiveHandler = (directive, parent, index) => {
    const invalid = requireLeafDirective(directive, parent, index, addError)
    if (invalid !== undefined) return invalid
    const { attrs } = extractAttributes(directive, parent, index, {
      id: { type: 'string' },
      src: { type: 'string' }
    })
    const id = hasLabel(directive) ? directive.label : attrs.id
    const src = attrs.src
    if (id && src) {
      audio.load(id, src)
    } else {
      addError('preloadAudio directive requires an id/label and src')
    }
    return removeNode(parent, index)
  }

  const handlePreloadImage: DirectiveHandler = (directive, parent, index) => {
    const invalid = requireLeafDirective(directive, parent, index, addError)
    if (invalid !== undefined) return invalid
    const { attrs } = extractAttributes(directive, parent, index, {
      id: { type: 'string' },
      src: { type: 'string' }
    })
    const id = hasLabel(directive) ? directive.label : attrs.id
    const src = attrs.src
    if (id && src) {
      void images.load(id, src)
    } else {
      addError('preloadImage directive requires an id/label and src')
    }
    return removeNode(parent, index)
  }

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

  const handleEmbed: DirectiveHandler = (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    const [p, i] = pair
    const invalid = requireLeafDirective(directive, p, i, addError)
    if (invalid !== undefined) return invalid
    const { attrs } = extractAttributes(directive, p, i, embedSchema)
    const raw = (directive.attributes || {}) as Record<string, unknown>
    const preset = attrs.from
      ? getPreset<Partial<EmbedAttrs> & Record<string, unknown>>(
          'embed',
          String(attrs.from)
        )
      : undefined
    const mergedRaw = mergeAttrs<Record<string, unknown>>(preset, raw)
    const mergedAttrs = mergeAttrs<EmbedAttrs>(preset, attrs)
    const normRaw = interpolateAttrs(mergedRaw, getGameData())
    const normAttrs = interpolateAttrs(mergedAttrs, getGameData())
    const { props, exclude } = buildSlideAssetProps(normAttrs, [
      'src',
      'allow',
      'referrerPolicy',
      'allowFullScreen'
    ])
    props.src = normAttrs.src
    if (normAttrs.allow) props.allow = normAttrs.allow
    if (normAttrs.referrerPolicy)
      props.referrerPolicy = normAttrs.referrerPolicy
    if (normAttrs.allowFullScreen) props.allowFullScreen = true
    applyAdditionalAttributes(mergedRaw, props, exclude, addError)
    applyAdditionalAttributes(normRaw, props, exclude, addError)
    const data = {
      hName: 'slideEmbed',
      hProperties: props as Properties
    }
    const node: Parent = { type: 'paragraph', children: [], data }
    return replaceWithIndentation(directive, p, i, [node as RootContent])
  }

  const handleImage: DirectiveHandler = (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    const [p, i] = pair
    const invalid = requireLeafDirective(directive, p, i, addError)
    if (invalid !== undefined) return invalid
    const { attrs } = extractAttributes(directive, p, i, imageSchema)
    const raw = (directive.attributes || {}) as Record<string, unknown>
    const preset = attrs.from
      ? getPreset<Partial<ImageAttrs>>('image', String(attrs.from))
      : undefined
    const mergedRaw = mergeAttrs<Record<string, unknown>>(preset, raw)
    const mergedAttrs = mergeAttrs<ImageAttrs>(preset, attrs)
    const normRaw = interpolateAttrs(mergedRaw, getGameData())
    const normAttrs = interpolateAttrs(mergedAttrs, getGameData())
    const { props, exclude } = buildSlideAssetProps(normAttrs, ['src', 'alt'])
    props.src = normAttrs.src
    if (normAttrs.alt) props.alt = normAttrs.alt
    applyAdditionalAttributes(mergedRaw, props, exclude, addError)
    applyAdditionalAttributes(normRaw, props, exclude, addError)
    const data = {
      hName: 'slideImage',
      hProperties: props as Properties
    }
    const node: Parent = { type: 'paragraph', children: [], data }
    return replaceWithIndentation(directive, p, i, [node as RootContent])
  }

  const handleShape: DirectiveHandler = (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    const [p, i] = pair
    if (
      directive.type !== 'textDirective' &&
      directive.type !== 'leafDirective'
    ) {
      const msg = 'shape can only be used as a leaf or text directive'
      console.error(msg)
      addError(msg)
      return removeNode(p, i)
    }
    const { attrs } = extractAttributes(directive, p, i, shapeSchema)
    const raw = (directive.attributes || {}) as Record<string, unknown>
    const preset = attrs.from
      ? getPreset<Partial<ShapeAttrs>>('shape', String(attrs.from))
      : undefined
    const mergedRaw = mergeAttrs(preset, raw)
    const mergedAttrs = mergeAttrs(
      preset,
      attrs as unknown as Record<string, unknown>
    ) as ShapeAttrs
    const normRaw = interpolateAttrs(mergedRaw, getGameData())
    const normAttrs = interpolateAttrs(mergedAttrs, getGameData()) as ShapeAttrs
    const { props, exclude } = buildSlideAssetProps(normAttrs, [
      'type',
      'points',
      'x1',
      'y1',
      'x2',
      'y2',
      'stroke',
      'strokeWidth',
      'fill',
      'radius',
      'shadow'
    ])
    props.type = normAttrs.type
    if (normAttrs.points) props.points = normAttrs.points
    if (typeof normAttrs.x1 === 'number') props.x1 = normAttrs.x1
    if (typeof normAttrs.y1 === 'number') props.y1 = normAttrs.y1
    if (typeof normAttrs.x2 === 'number') props.x2 = normAttrs.x2
    if (typeof normAttrs.y2 === 'number') props.y2 = normAttrs.y2
    if (normAttrs.stroke) props.stroke = normAttrs.stroke
    if (typeof normAttrs.strokeWidth === 'number')
      props.strokeWidth = normAttrs.strokeWidth
    if (normAttrs.fill) props.fill = normAttrs.fill
    if (typeof normAttrs.radius === 'number') props.radius = normAttrs.radius
    if (typeof normAttrs.shadow === 'boolean') props.shadow = normAttrs.shadow
    applyAdditionalAttributes(mergedRaw, props, exclude, addError)
    applyAdditionalAttributes(normRaw, props, exclude, addError)
    const node: Parent = {
      type: 'paragraph',
      children: [],
      data: { hName: 'slideShape', hProperties: props as Properties }
    }
    return replaceWithIndentation(directive, p, i, [node as RootContent])
  }

  return {
    preloadAudio: handlePreloadAudio,
    preloadImage: handlePreloadImage,
    sound: handleSound,
    bgm: handleBgm,
    volume: handleVolume,
    embed: handleEmbed,
    image: handleImage,
    shape: handleShape
  }
}
