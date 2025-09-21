import { SKIP } from 'unist-util-visit'
import type { Parent, RootContent, Text as MdText } from 'mdast'
import type { ContainerDirective } from 'mdast-util-directive'
import type { Properties } from 'hast'
import type { DirectiveHandler } from '@campfire/remark-campfire'
import type { DirectiveNode } from '@campfire/utils/directiveUtils'
import {
  type AttributeSchema,
  type ExtractedAttrs,
  expandIndentedCode,
  extractAttributes,
  removeNode,
  replaceWithIndentation,
  runDirectiveBlock,
  stripLabel
} from '@campfire/utils/directiveUtils'
import {
  applyAdditionalAttributes,
  ensureParentIndex,
  interpolateAttrs,
  mergeAttrs,
  removeDirectiveMarker,
  isMarkerParagraph,
  parseDeckSize,
  parseThemeValue
} from '@campfire/utils/directiveHandlerUtils'
import { interpolateString } from '@campfire/utils/core'
import type {
  Transition,
  Direction
} from '@campfire/components/Deck/Slide/types'
import { isWhitespaceRootContent } from '@campfire/utils/nodePredicates'

const DIRECTIVE_MARKER = ':::'

const REVEAL_EXCLUDES = [
  'at',
  'exitAt',
  'enter',
  'exit',
  'enterDir',
  'exitDir',
  'enterDuration',
  'exitDuration',
  'onEnter',
  'interruptBehavior',
  'className',
  'style',
  'id'
] as const

const LAYER_NUMERIC_ATTRS = [
  'x',
  'y',
  'w',
  'h',
  'z',
  'rotate',
  'scale'
] as const

const LAYER_EXCLUDES = [...LAYER_NUMERIC_ATTRS, 'anchor', 'id'] as const

const SLIDE_EXCLUDES = [
  'transition',
  'enter',
  'exit',
  'enterDir',
  'exitDir',
  'enterDuration',
  'exitDuration',
  'enterDelay',
  'exitDelay',
  'enterEasing',
  'exitEasing',
  'steps',
  'onEnter',
  'onExit'
] as const

const DECK_EXCLUDES = [
  'size',
  'transition',
  'theme',
  'autoplay',
  'autoplayDelay',
  'pause',
  'id',
  'hideNavigation',
  'showSlideCount',
  'initialSlide',
  'a11y'
] as const

const revealSchema = {
  at: { type: 'number' },
  exitAt: { type: 'number' },
  enter: { type: 'string' },
  exit: { type: 'string' },
  enterDir: { type: 'string' },
  exitDir: { type: 'string' },
  enterDuration: { type: 'number' },
  exitDuration: { type: 'number' },
  onEnter: { type: 'string' },
  interruptBehavior: { type: 'string' },
  className: { type: 'string' },
  style: { type: 'string' },
  from: { type: 'string', expression: false },
  id: { type: 'string' }
} as const

const layerSchema = {
  x: { type: 'number' },
  y: { type: 'number' },
  w: { type: 'number' },
  h: { type: 'number' },
  z: { type: 'number' },
  rotate: { type: 'number' },
  scale: { type: 'number' },
  anchor: { type: 'string' },
  className: { type: 'string' },
  id: { type: 'string' },
  from: { type: 'string', expression: false }
} as const

const wrapperSchema = {
  as: { type: 'string' },
  from: { type: 'string', expression: false },
  id: { type: 'string' }
} as const

const slideSchema = {
  transition: { type: 'string' },
  enter: { type: 'string' },
  exit: { type: 'string' },
  enterDir: { type: 'string' },
  exitDir: { type: 'string' },
  enterDuration: { type: 'number' },
  exitDuration: { type: 'number' },
  enterDelay: { type: 'number' },
  exitDelay: { type: 'number' },
  enterEasing: { type: 'string', expression: false },
  exitEasing: { type: 'string', expression: false },
  steps: { type: 'number' },
  onEnter: { type: 'string' },
  onExit: { type: 'string' },
  from: { type: 'string', expression: false },
  id: { type: 'string' }
} as const

type RevealAttrs = ExtractedAttrs<typeof revealSchema>
type LayerAttrs = ExtractedAttrs<typeof layerSchema>
type WrapperAttrs = ExtractedAttrs<typeof wrapperSchema>
type SlideAttrs = ExtractedAttrs<typeof slideSchema>

export interface LayoutHandlerContext {
  addError: (msg: string) => void
  getGameData: () => Record<string, unknown>
  getPreset: <T>(type: string, name: string) => T | undefined
  getDirectiveHandlers: () => Record<string, DirectiveHandler>
  setLastLayerNode: (layer: Parent, parent: Parent) => void
  getLastLayerNode: () => { layer: Parent; parent: Parent } | undefined
  clearLastLayerNode: () => void
}

const isWhitespaceNode = isWhitespaceRootContent
const isTextNode = (node: RootContent): node is MdText => node.type === 'text'

const buildTransition = (
  base?: Transition | Transition['type'],
  dir?: Direction,
  duration?: number,
  delay?: number,
  easing?: string
): Transition | undefined => {
  if (!base) return undefined
  const t: Transition = typeof base === 'string' ? { type: base } : { ...base }
  if (dir) t.dir = dir
  if (typeof duration === 'number') t.duration = duration
  if (typeof delay === 'number') t.delay = delay
  if (easing) t.easing = easing
  return t
}

const createContainerHandler = <S extends AttributeSchema>(
  ctx: LayoutHandlerContext,
  hName: string | ((attrs: ExtractedAttrs<S>) => string),
  schema: S,
  mapProps: (
    attrs: ExtractedAttrs<S>,
    raw: Record<string, unknown>
  ) => Record<string, unknown>,
  transform?: (
    children: RootContent[],
    attrs: ExtractedAttrs<S>
  ) => RootContent[],
  beforeRemove?: (parent: Parent, markerIndex: number) => void
): DirectiveHandler => {
  return (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    const [p, i] = pair
    if (directive.type !== 'containerDirective') {
      const msg = `${directive.name} can only be used as a container directive`
      console.error(msg)
      ctx.addError(msg)
      return removeNode(p, i)
    }
    const container = directive as ContainerDirective
    const { attrs } = extractAttributes<S>(directive, p, i, schema)
    const rawAttrs = (directive.attributes || {}) as Record<string, unknown>
    const processed = runDirectiveBlock(
      expandIndentedCode(container.children as RootContent[]),
      ctx.getDirectiveHandlers()
    )
    const stripped = stripLabel(processed)
    const children = transform ? transform(stripped, attrs) : stripped
    const tag = typeof hName === 'function' ? hName(attrs) : hName
    const node: Parent = {
      type: 'paragraph',
      children,
      data: {
        hName: tag,
        hProperties: mapProps(attrs, rawAttrs) as Properties
      }
    }
    const newIndex = replaceWithIndentation(directive, p, i, [
      node as RootContent
    ])
    const markerIndex = newIndex + 1
    if (beforeRemove) beforeRemove(p, markerIndex)
    removeDirectiveMarker(p, markerIndex)
    if (directive.name === 'layer') {
      ctx.setLastLayerNode(p.children[newIndex] as Parent, p)
    } else {
      ctx.clearLastLayerNode()
    }
    return [SKIP, newIndex]
  }
}

const buildSlideProps = (
  ctx: LayoutHandlerContext,
  attrs: SlideAttrs,
  raw: Record<string, unknown> = {}
): Record<string, unknown> => {
  const props: Record<string, unknown> = {}
  const preset = attrs.from
    ? ctx.getPreset<Partial<SlideAttrs> & Record<string, unknown>>(
        'slide',
        String(attrs.from)
      ) || {}
    : undefined
  let enter = buildTransition(
    (preset?.enter ?? preset?.transition) as
      | Transition
      | Transition['type']
      | undefined,
    preset?.enterDir as Direction | undefined,
    preset?.enterDuration,
    preset?.enterDelay,
    preset?.enterEasing
  )
  let exit = buildTransition(
    (preset?.exit ?? preset?.transition) as
      | Transition
      | Transition['type']
      | undefined,
    preset?.exitDir as Direction | undefined,
    preset?.exitDuration,
    preset?.exitDelay,
    preset?.exitEasing
  )
  if (preset) {
    if (typeof preset.steps === 'number') props.steps = preset.steps
    if (preset.onEnter) props.onEnter = preset.onEnter
    if (preset.onExit) props.onExit = preset.onExit
  }
  enter = buildTransition(
    (attrs.enter ?? attrs.transition ?? enter?.type) as
      | Transition
      | Transition['type']
      | undefined,
    (attrs.enterDir as Direction | undefined) ?? enter?.dir,
    attrs.enterDuration ?? enter?.duration,
    attrs.enterDelay ?? enter?.delay,
    attrs.enterEasing ?? enter?.easing
  )
  exit = buildTransition(
    (attrs.exit ?? attrs.transition ?? exit?.type) as
      | Transition
      | Transition['type']
      | undefined,
    (attrs.exitDir as Direction | undefined) ?? exit?.dir,
    attrs.exitDuration ?? exit?.duration,
    attrs.exitDelay ?? exit?.delay,
    attrs.exitEasing ?? exit?.easing
  )
  if (enter || exit) {
    props.transition = {
      ...(enter ? { enter } : {}),
      ...(exit ? { exit } : {})
    }
  }
  if (typeof attrs.steps === 'number') props.steps = attrs.steps
  if (attrs.onEnter) props.onEnter = attrs.onEnter
  if (attrs.onExit) props.onExit = attrs.onExit
  const mergedRaw = mergeAttrs(preset, raw)
  applyAdditionalAttributes(
    mergedRaw,
    props,
    [...SLIDE_EXCLUDES, 'from'],
    ctx.addError
  )
  return props
}

/**
 * Creates handlers for layout directives such as `:::reveal`, `:::layer`,
 * `:::wrapper`, and `:::deck`.
 *
 * @param ctx - Context providing helpers and access to shared handler state.
 * @returns An object containing layout directive handlers.
 */
export const createLayoutHandlers = (ctx: LayoutHandlerContext) => {
  const handleReveal = createContainerHandler(
    ctx,
    'reveal',
    revealSchema,
    (attrs, raw) => {
      const props: Record<string, unknown> = {}
      const preset = attrs.from
        ? ctx.getPreset<Partial<RevealAttrs> & Record<string, unknown>>(
            'reveal',
            String(attrs.from)
          )
        : undefined
      let enter = buildTransition(
        preset?.enter as Transition | Transition['type'] | undefined,
        preset?.enterDir as Direction | undefined,
        preset?.enterDuration
      )
      let exit = buildTransition(
        preset?.exit as Transition | Transition['type'] | undefined,
        preset?.exitDir as Direction | undefined,
        preset?.exitDuration
      )
      if (preset) {
        if (typeof preset.at === 'number') props.at = preset.at
        if (typeof preset.exitAt === 'number') props.exitAt = preset.exitAt
        if (preset.interruptBehavior)
          props.interruptBehavior = preset.interruptBehavior
        if (preset.onEnter) props.onEnter = preset.onEnter
        applyAdditionalAttributes(preset, props, REVEAL_EXCLUDES, ctx.addError)
      }
      if (typeof attrs.at === 'number') props.at = attrs.at
      if (typeof attrs.exitAt === 'number') props.exitAt = attrs.exitAt
      enter = buildTransition(
        (attrs.enter ?? enter?.type) as
          | Transition
          | Transition['type']
          | undefined,
        (attrs.enterDir as Direction | undefined) ?? enter?.dir,
        attrs.enterDuration ?? enter?.duration
      )
      exit = buildTransition(
        (attrs.exit ?? exit?.type) as
          | Transition
          | Transition['type']
          | undefined,
        (attrs.exitDir as Direction | undefined) ?? exit?.dir,
        attrs.exitDuration ?? exit?.duration
      )
      if (enter) props.enter = enter
      if (exit) props.exit = exit
      if (attrs.interruptBehavior)
        props.interruptBehavior = attrs.interruptBehavior
      if (attrs.onEnter) props.onEnter = attrs.onEnter
      const mergedRaw = mergeAttrs(preset, raw)
      const { className: classAttr = '', style: styleAttr } = interpolateAttrs(
        mergedRaw,
        ctx.getGameData()
      )
      if (classAttr) props.className = classAttr
      if (styleAttr) props.style = styleAttr
      if (attrs.id) props.id = attrs.id
      applyAdditionalAttributes(
        mergedRaw,
        props,
        [...REVEAL_EXCLUDES, 'from', 'id'],
        ctx.addError
      )
      return props
    }
  )

  const handleLayer = createContainerHandler(
    ctx,
    'layer',
    layerSchema,
    (attrs, raw) => {
      const props: Record<string, unknown> = {}
      const preset = attrs.from
        ? ctx.getPreset<Partial<LayerAttrs> & Record<string, unknown>>(
            'layer',
            String(attrs.from)
          )
        : undefined
      if (preset) {
        for (const key of LAYER_NUMERIC_ATTRS) {
          const value = preset[key]
          if (typeof value === 'number') props[key] = value
        }
        if (preset.anchor) props.anchor = preset.anchor
        applyAdditionalAttributes(preset, props, LAYER_EXCLUDES, ctx.addError)
      }
      for (const key of LAYER_NUMERIC_ATTRS) {
        const value = attrs[key]
        if (typeof value === 'number') props[key] = value
      }
      if (attrs.anchor) props.anchor = attrs.anchor
      const mergedRaw = mergeAttrs(preset, raw)
      props['data-testid'] = 'layer'
      let classAttr = ''
      const gameData = ctx.getGameData()
      if (typeof attrs.className === 'string') {
        classAttr = attrs.className.includes('${')
          ? interpolateString(attrs.className, gameData)
          : attrs.className
      } else if (typeof mergedRaw.className === 'string') {
        classAttr = mergedRaw.className.includes('${')
          ? interpolateString(mergedRaw.className, gameData)
          : mergedRaw.className
      }
      if (classAttr) props.className = classAttr
      if (attrs.id) props.id = attrs.id
      applyAdditionalAttributes(
        mergedRaw,
        props,
        [...LAYER_EXCLUDES, 'from', 'layerClassName', 'id'],
        ctx.addError
      )
      return props
    },
    undefined,
    (parent, markerIndex) => {
      const layerNode = parent.children[markerIndex - 1] as Parent
      let idx = markerIndex
      let end = idx
      while (
        end < parent.children.length &&
        !isMarkerParagraph(parent.children[end] as RootContent)
      )
        end++
      const pending = parent.children.splice(idx, end - idx) as RootContent[]
      if (end < parent.children.length) parent.children.splice(idx, 1)
      while (idx < parent.children.length) {
        const node = parent.children[idx] as RootContent
        if (isMarkerParagraph(node)) {
          parent.children.splice(idx, 1)
          continue
        }
        if (node.type === 'containerDirective' || isWhitespaceNode(node)) {
          pending.push(node)
          parent.children.splice(idx, 1)
          continue
        }
        break
      }
      if (pending.length) {
        const processed = runDirectiveBlock(pending, ctx.getDirectiveHandlers())
        if (processed.length) {
          const last = processed[processed.length - 1]
          if (last.type === 'paragraph') {
            const idxText = last.children.findIndex(
              child =>
                isTextNode(child as RootContent) &&
                (child as MdText).value.includes(DIRECTIVE_MARKER)
            )
            if (idxText !== -1) last.children.splice(idxText, 1)
            if (
              last.children.length === 0 ||
              last.children.every(isWhitespaceNode)
            )
              processed.pop()
          }
        }
        if (!layerNode.children) layerNode.children = []
        ;(layerNode.children as RootContent[]).push(...processed)
      }
      let prev = -1
      while (prev !== parent.children.length) {
        prev = parent.children.length
        removeDirectiveMarker(parent, idx)
      }
    }
  )

  const resolveWrapperTag = (attrs: WrapperAttrs): string => {
    let tag = typeof attrs.as === 'string' ? attrs.as : undefined
    if (!tag && attrs.from) {
      const preset = ctx.getPreset<Record<string, unknown>>(
        'wrapper',
        String(attrs.from)
      )
      if (typeof preset?.as === 'string') tag = preset.as
    }
    tag = typeof tag === 'string' ? tag : 'div'
    return ['span', 'div', 'p', 'section'].includes(tag) ? tag : 'div'
  }

  const handleWrapper = createContainerHandler(
    ctx,
    resolveWrapperTag,
    wrapperSchema,
    (attrs, raw) => {
      const props: Record<string, unknown> = {}
      const preset = attrs.from
        ? ctx.getPreset<Record<string, unknown>>('wrapper', String(attrs.from))
        : undefined
      const mergedRaw = mergeAttrs(preset, raw)
      props['data-testid'] = 'wrapper'
      const { className: classAttr = '' } = interpolateAttrs(
        mergedRaw,
        ctx.getGameData()
      )
      props.className = ['campfire-wrapper', classAttr]
        .filter(Boolean)
        .join(' ')
      if (attrs.id) props.id = attrs.id
      applyAdditionalAttributes(
        mergedRaw,
        props,
        ['as', 'className', 'from', 'id'],
        ctx.addError
      )
      return props
    },
    children =>
      (
        children.flatMap(child => {
          if (child.type !== 'paragraph') return child
          const paragraph = child as Parent
          const data = paragraph.data as { hName?: unknown } | undefined
          return data && typeof data.hName === 'string'
            ? paragraph
            : paragraph.children
        }) as RootContent[]
      ).filter(child => {
        if (child.type === 'paragraph') {
          const data = (child as Parent).data as { hName?: unknown } | undefined
          if (data && typeof data.hName === 'string') return true
        }
        return !isWhitespaceNode(child)
      })
  )

  const handleDeck: DirectiveHandler = (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    const [p, i] = pair
    if (directive.type !== 'containerDirective') {
      const msg = 'deck can only be used as a container directive'
      console.error(msg)
      ctx.addError(msg)
      return removeNode(p, i)
    }
    const container = directive as ContainerDirective
    const { attrs: deckAttrs } = extractAttributes(
      directive,
      p,
      i,
      {
        size: { type: 'string' },
        transition: { type: 'string' },
        theme: { type: 'string' },
        from: { type: 'string', expression: false },
        autoplay: { type: 'boolean' },
        autoplayDelay: { type: 'number' },
        pause: { type: 'boolean' },
        id: { type: 'string' },
        hideNavigation: { type: 'boolean' },
        showSlideCount: { type: 'boolean' },
        initialSlide: { type: 'number' },
        a11y: { type: 'object', expression: false }
      },
      { label: false }
    )

    const deckProps: Record<string, unknown> = {}
    if (deckAttrs.from) {
      const preset = ctx.getPreset<Record<string, unknown>>(
        'deck',
        String(deckAttrs.from)
      )
      if (preset) {
        if (typeof preset.size === 'string')
          deckProps.size = parseDeckSize(preset.size as string)
        if (preset.transition) deckProps.transition = preset.transition
        if ('theme' in preset) {
          const t = parseThemeValue(preset.theme)
          if (t) deckProps.theme = t
        }
        applyAdditionalAttributes(
          preset,
          deckProps,
          DECK_EXCLUDES,
          ctx.addError
        )
      }
    }
    if (typeof deckAttrs.size === 'string') {
      deckProps.size = parseDeckSize(deckAttrs.size)
    }
    if (deckAttrs.transition) deckProps.transition = deckAttrs.transition
    if ('theme' in deckAttrs) {
      const theme = parseThemeValue(deckAttrs.theme)
      if (theme) deckProps.theme = theme
    }
    if (deckAttrs.autoplay) {
      deckProps.autoAdvanceMs =
        typeof deckAttrs.autoplayDelay === 'number'
          ? deckAttrs.autoplayDelay
          : 3000
      if (deckAttrs.pause) deckProps.autoAdvancePaused = true
    }
    if (deckAttrs.hideNavigation) deckProps.hideNavigation = true
    if (deckAttrs.showSlideCount) deckProps.showSlideCount = true
    if (typeof deckAttrs.initialSlide === 'number')
      deckProps.initialSlide = deckAttrs.initialSlide
    if (deckAttrs.id) deckProps.id = deckAttrs.id
    if (typeof deckAttrs.a11y === 'string') {
      try {
        deckProps.a11y = JSON.parse(deckAttrs.a11y)
      } catch {
        /* ignore */
      }
    } else if (deckAttrs.a11y) {
      deckProps.a11y = deckAttrs.a11y
    }
    const rawDeckAttrs = (directive.attributes || {}) as Record<string, unknown>
    applyAdditionalAttributes(
      rawDeckAttrs,
      deckProps,
      [...DECK_EXCLUDES, 'from', 'id'],
      ctx.addError
    )

    const slides: Parent[] = []

    let endPos = p.children.length
    for (let j = p.children.length - 1; j > i; j--) {
      if (isMarkerParagraph(p.children[j] as RootContent)) {
        endPos = j
        break
      }
    }
    const rawFollowing = p.children.slice(i + 1, endPos)
    if (endPos > i + 1) {
      p.children.splice(i + 1, endPos - (i + 1))
    }
    const following = rawFollowing.filter(
      node =>
        !isMarkerParagraph(node as RootContent) &&
        !isWhitespaceNode(node as RootContent)
    )

    const children: RootContent[] = stripLabel(
      runDirectiveBlock(
        expandIndentedCode([
          ...(container.children as RootContent[]),
          ...following
        ]),
        ctx.getDirectiveHandlers()
      )
    ).filter(
      child =>
        !isMarkerParagraph(child as RootContent) &&
        !isWhitespaceNode(child as RootContent)
    )
    let pendingAttrs: Record<string, unknown> = {}
    let pendingNodes: RootContent[] = []

    const commitPending = () => {
      const tempParent: Parent = { type: 'root', children: pendingNodes }
      removeDirectiveMarker(tempParent, tempParent.children.length - 1)
      pendingNodes = tempParent.children as RootContent[]
      while (pendingNodes.length && isWhitespaceNode(pendingNodes[0]))
        pendingNodes.shift()
      while (
        pendingNodes.length &&
        isWhitespaceNode(pendingNodes[pendingNodes.length - 1])
      )
        pendingNodes.pop()

      if (pendingNodes.length === 0 && Object.keys(pendingAttrs).length === 0)
        return
      const processed = runDirectiveBlock(
        expandIndentedCode(pendingNodes),
        ctx.getDirectiveHandlers()
      )
      const content = stripLabel(processed)
      const attrsEmpty = Object.keys(pendingAttrs).length === 0
      if (slides.length > 0 && attrsEmpty) {
        const lastSlide = slides[slides.length - 1]
        ;(lastSlide.children as RootContent[]).push(...content)
      } else {
        const dummy: DirectiveNode = {
          type: 'containerDirective',
          name: 'slide',
          attributes: pendingAttrs as Record<string, string | null>,
          children: []
        }
        const { attrs: parsed } = extractAttributes(
          dummy,
          undefined,
          undefined,
          slideSchema
        )
        const slideNode: Parent = {
          type: 'paragraph',
          children: content,
          data: {
            hName: 'slide',
            hProperties: buildSlideProps(
              ctx,
              parsed,
              pendingAttrs as Record<string, unknown>
            ) as Properties
          }
        }
        slides.push(slideNode)
      }
      pendingAttrs = {}
      pendingNodes = []
    }

    children.forEach((child, childIndex) => {
      if (
        child.type === 'containerDirective' &&
        (child as ContainerDirective).name === 'slide'
      ) {
        commitPending()
        const slideDir = child as ContainerDirective
        const { attrs: parsed } = extractAttributes(
          slideDir,
          container,
          childIndex,
          slideSchema
        )
        const processed = runDirectiveBlock(
          expandIndentedCode(slideDir.children as RootContent[]),
          ctx.getDirectiveHandlers()
        )
        const content = stripLabel(processed)
        const slideNode: Parent = {
          type: 'paragraph',
          children: content,
          data: {
            hName: 'slide',
            hProperties: buildSlideProps(
              ctx,
              parsed,
              slideDir.attributes as Record<string, unknown>
            ) as Properties
          }
        }
        slides.push(slideNode)
      } else {
        pendingNodes.push(child)
      }
    })
    commitPending()

    const deckNode: Parent = {
      type: 'paragraph',
      children: slides as RootContent[],
      data: { hName: 'deck', hProperties: deckProps as Properties }
    }
    const newIndex = replaceWithIndentation(directive, p, i, [
      deckNode as RootContent
    ])
    removeDirectiveMarker(p, newIndex + 1)
    return [SKIP, newIndex]
  }

  return {
    reveal: handleReveal,
    layer: handleLayer,
    wrapper: handleWrapper,
    deck: handleDeck
  }
}
