import { toString } from 'mdast-util-to-string'
import type { Parent, RootContent } from 'mdast'
import type { ContainerDirective } from 'mdast-util-directive'
import type { Properties } from 'hast'
import type { DirectiveHandler } from '@campfire/remark-campfire'
import {
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
  mergeAttrs
} from '@campfire/utils/directiveHandlerUtils'
import { interpolateString } from '@campfire/utils/core'

const textSchema = {
  x: { type: 'number' },
  y: { type: 'number' },
  w: { type: 'number' },
  h: { type: 'number' },
  z: { type: 'number' },
  rotate: { type: 'number' },
  scale: { type: 'number' },
  anchor: { type: 'string' },
  as: { type: 'string' },
  align: { type: 'string' },
  size: { type: 'number' },
  weight: { type: 'number' },
  lineHeight: { type: 'number' },
  color: { type: 'string' },
  id: { type: 'string' },
  layerId: { type: 'string' },
  from: { type: 'string', expression: false }
} as const

type TextAttrs = ExtractedAttrs<typeof textSchema>

export interface TextHandlerContext {
  addError: (msg: string) => void
  getGameData: () => Record<string, unknown>
  getPreset: <T>(type: string, name: string) => T | undefined
  getDirectiveHandlers: () => Record<string, DirectiveHandler>
}

/**
 * Creates handlers for text directives, converting `:::text` blocks into slide text nodes.
 *
 * @param ctx - Context providing helpers and shared handler access.
 * @returns An object containing the text directive handler.
 */
export const createTextHandlers = (ctx: TextHandlerContext) => {
  const { addError, getGameData, getPreset, getDirectiveHandlers } = ctx

  const handleText: DirectiveHandler = (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    const [p, i] = pair
    if (directive.type !== 'containerDirective') {
      const msg = 'text can only be used as a container directive'
      console.error(msg)
      addError(msg)
      return removeNode(p, i)
    }
    const container = directive as ContainerDirective
    const { attrs } = extractAttributes(directive, p, i, textSchema)
    const raw = (directive.attributes || {}) as Record<string, unknown>
    const preset = attrs.from
      ? getPreset<Record<string, unknown>>('text', String(attrs.from))
      : undefined
    const mergedRaw = mergeAttrs(preset, raw)
    const mergedAttrs = mergeAttrs(
      preset,
      attrs as unknown as Record<string, unknown>
    ) as TextAttrs & Record<string, unknown>
    const tagName = mergedAttrs.as ? String(mergedAttrs.as) : 'p'
    const style: string[] = []
    style.push('position:absolute')
    if (typeof mergedAttrs.x === 'number') style.push(`left:${mergedAttrs.x}px`)
    if (typeof mergedAttrs.y === 'number') style.push(`top:${mergedAttrs.y}px`)
    if (typeof mergedAttrs.w === 'number')
      style.push(`width:${mergedAttrs.w}px`)
    if (typeof mergedAttrs.h === 'number')
      style.push(`height:${mergedAttrs.h}px`)
    if (typeof mergedAttrs.z === 'number')
      style.push(`z-index:${mergedAttrs.z}`)
    const transforms: string[] = []
    if (typeof mergedAttrs.rotate === 'number')
      transforms.push(`rotate(${mergedAttrs.rotate}deg)`)
    if (typeof mergedAttrs.scale === 'number')
      transforms.push(`scale(${mergedAttrs.scale})`)
    if (transforms.length) style.push(`transform:${transforms.join(' ')}`)
    if (mergedAttrs.anchor && mergedAttrs.anchor !== 'top-left') {
      const originMap: Record<string, string> = {
        'top-left': '0% 0%',
        top: '50% 0%',
        'top-right': '100% 0%',
        left: '0% 50%',
        center: '50% 50%',
        right: '100% 50%',
        'bottom-left': '0% 100%',
        bottom: '50% 100%',
        'bottom-right': '100% 100%'
      }
      const origin = originMap[mergedAttrs.anchor]
      if (origin) style.push(`transform-origin:${origin}`)
    }
    if (mergedAttrs.align) style.push(`text-align:${mergedAttrs.align}`)
    if (typeof mergedAttrs.size === 'number')
      style.push(`font-size:${mergedAttrs.size}px`)
    if (typeof mergedAttrs.weight === 'number')
      style.push(`font-weight:${mergedAttrs.weight}`)
    if (typeof mergedAttrs.lineHeight === 'number')
      style.push(`line-height:${mergedAttrs.lineHeight}`)
    if (mergedAttrs.color) style.push(`color:${mergedAttrs.color}`)
    const rawStyle = mergedRaw.style
    if (rawStyle) {
      if (typeof rawStyle === 'string') {
        const styleAttr = rawStyle.includes('${')
          ? interpolateString(rawStyle, getGameData())
          : rawStyle
        if (styleAttr) style.push(styleAttr)
      } else if (typeof rawStyle === 'object') {
        const entries = Object.entries(rawStyle as Record<string, unknown>).map(
          ([k, v]) => `${k}:${v}`
        )
        style.push(entries.join(';'))
      }
    }
    const props: Record<string, unknown> = {}
    if (typeof mergedAttrs.x === 'number') props.x = mergedAttrs.x
    if (typeof mergedAttrs.y === 'number') props.y = mergedAttrs.y
    if (typeof mergedAttrs.w === 'number') props.w = mergedAttrs.w
    if (typeof mergedAttrs.h === 'number') props.h = mergedAttrs.h
    if (typeof mergedAttrs.z === 'number') props.z = mergedAttrs.z
    if (typeof mergedAttrs.rotate === 'number')
      props.rotate = mergedAttrs.rotate
    if (typeof mergedAttrs.scale === 'number') props.scale = mergedAttrs.scale
    if (mergedAttrs.anchor) props.anchor = mergedAttrs.anchor
    if (style.length) props.style = style.join(';')
    const { className: classAttr, layerClassName: layerClassAttr } =
      interpolateAttrs(
        {
          className: mergedRaw.className,
          layerClassName: mergedRaw.layerClassName
        },
        getGameData()
      ) as { className?: string; layerClassName?: string }
    const classes = ['text-base', 'font-normal']
    if (classAttr) classes.unshift(classAttr)
    props.className = classes.join(' ')
    if (layerClassAttr) props.layerClassName = layerClassAttr
    if (mergedAttrs.id) props.id = mergedAttrs.id
    if (mergedAttrs.layerId) props.layerId = mergedAttrs.layerId
    props['data-component'] = 'slideText'
    props['data-as'] = tagName
    applyAdditionalAttributes(
      mergedRaw,
      props,
      [
        'x',
        'y',
        'w',
        'h',
        'z',
        'rotate',
        'scale',
        'anchor',
        'as',
        'align',
        'size',
        'weight',
        'lineHeight',
        'color',
        'style',
        'className',
        'layerClassName',
        'id',
        'layerId',
        'from'
      ],
      addError
    )
    const processed = runDirectiveBlock(
      expandIndentedCode(container.children as RootContent[]),
      getDirectiveHandlers()
    )
    const stripped = stripLabel(processed)
    const content = toString(stripped).trim()
    const node: Parent = {
      type: 'paragraph',
      children: [{ type: 'text', value: content } as RootContent],
      data: { hName: tagName, hProperties: props as Properties }
    }
    return replaceWithIndentation(directive, p, i, [node as RootContent])
  }

  return { text: handleText }
}
