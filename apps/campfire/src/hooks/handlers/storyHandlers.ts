import { SKIP } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import type { InlineCode, Parent, RootContent, Text as MdText } from 'mdast'
import type { ContainerDirective } from 'mdast-util-directive'
import type { Properties } from 'hast'
import type { DirectiveHandler } from '@campfire/remark-campfire'
import {
  expandIndentedCode,
  extractAttributes,
  filterDirectiveChildren,
  removeNode,
  replaceWithIndentation,
  runDirectiveBlock,
  stripLabel
} from '@campfire/utils/directiveUtils'
import {
  applyAdditionalAttributes,
  ensureParentIndex,
  interpolateAttrs,
  removeDirectiveMarker
} from '@campfire/utils/directiveHandlerUtils'
import { parseNumericValue } from '@campfire/utils/math'

const NUMERIC_PATTERN = /^\d+$/
const ALLOWED_ONEXIT_DIRECTIVES = new Set([
  'set',
  'setOnce',
  'array',
  'arrayOnce',
  'createRange',
  'setRange',
  'unset',
  'random',
  'randomOnce',
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'concat',
  'checkpoint',
  'loadCheckpoint',
  'clearCheckpoint',
  'save',
  'load',
  'clearSave',
  'lang',
  'translations',
  'if',
  'for',
  'switch',
  'batch'
])
const ALLOWED_EFFECT_DIRECTIVES = ALLOWED_ONEXIT_DIRECTIVES

export interface StoryHandlerContext {
  addError: (msg: string) => void
  getGameData: () => Record<string, unknown>
  setPreset: (
    target: string,
    name: string,
    attrs: Record<string, unknown>
  ) => void
  getCurrentPassageId: () => string
  getLastPassageId: () => string | undefined
  resetDirectiveState: () => void
  isOnExitSeen: () => boolean
  setOnExitSeen: (seen: boolean) => void
  isOnExitErrored: () => boolean
  setOnExitError: (errored: boolean) => void
}

const createSerializedDirectiveHandler = (
  addError: (msg: string) => void,
  directiveName: string,
  allowedDirectives: Set<string>,
  buildProperties: (params: {
    filtered: RootContent[]
    content: string
  }) => Properties
): DirectiveHandler => {
  return (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    const [p, i] = pair
    const container = directive as ContainerDirective
    const rawChildren = runDirectiveBlock(
      expandIndentedCode(container.children as RootContent[])
    )
    const processedChildren = stripLabel(rawChildren)
    const [filtered, invalid] = filterDirectiveChildren(
      processedChildren,
      allowedDirectives
    )
    if (invalid) {
      const allowedList = [...allowedDirectives].join(', ')
      const msg = `${directiveName} only supports directives: ${allowedList}`
      console.error(msg)
      addError(msg)
    }
    const content = JSON.stringify(filtered)
    const node: Parent = {
      type: 'paragraph',
      children: [{ type: 'text', value: '' }],
      data: {
        hName: directiveName,
        hProperties: buildProperties({ filtered, content })
      }
    }
    const newIndex = replaceWithIndentation(directive, p, i, [
      node as RootContent
    ])
    const markerIndex = newIndex + 1
    removeDirectiveMarker(p, markerIndex)
    return [SKIP, newIndex]
  }
}

/**
 * Creates handlers for story-level directives such as `:preset`, `:show`,
 * `:::effect`, and `:::onExit`.
 *
 * @param ctx - Context providing state access and helpers.
 * @returns An object containing story directive handlers.
 */
export const createStoryHandlers = (ctx: StoryHandlerContext) => {
  const {
    addError,
    getGameData,
    setPreset,
    getCurrentPassageId,
    getLastPassageId,
    resetDirectiveState,
    isOnExitSeen,
    setOnExitSeen,
    isOnExitErrored,
    setOnExitError
  } = ctx

  const handleShow: DirectiveHandler = (directive, parent, index) => {
    let raw = toString(directive).trim()
    if (
      directive.children &&
      directive.children.length === 1 &&
      directive.children[0].type === 'inlineCode'
    ) {
      raw = `\`${(directive.children[0] as InlineCode).value}\``
    }
    if (!raw) return removeNode(parent, index)
    const keyPattern = /^[A-Za-z_$][A-Za-z0-9_$]*$/
    const props: Record<string, unknown> = keyPattern.test(raw)
      ? { 'data-key': raw }
      : { 'data-expr': raw }
    const attrs = interpolateAttrs(
      (directive.attributes || {}) as Record<string, unknown>,
      getGameData()
    )
    if (Object.prototype.hasOwnProperty.call(attrs, 'class')) {
      const msg = 'class is a reserved attribute. Use className instead.'
      console.error(msg)
      addError(msg)
    }
    const asAttr = typeof attrs.as === 'string' ? attrs.as : undefined
    if (asAttr) {
      props.as = asAttr
      const classAttr =
        typeof attrs.className === 'string' ? attrs.className : ''
      const styleAttr =
        typeof attrs.style === 'string' ? attrs.style : undefined
      if (classAttr) props.className = classAttr
      if (styleAttr) props.style = styleAttr
    }
    applyAdditionalAttributes(
      attrs,
      props,
      ['as', 'className', 'style'],
      addError
    )
    const node: MdText = {
      type: 'text',
      value: '',
      data: {
        hName: 'show',
        hProperties: props as Properties
      }
    }
    const pair = ensureParentIndex(parent, index)
    if (pair) {
      const [p, i] = pair
      return replaceWithIndentation(directive, p, i, [node])
    }
    return index
  }

  const handleEffect: DirectiveHandler = (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    const [p, i] = pair
    const { attrs, label } = extractAttributes(
      directive,
      p,
      i,
      { watch: { type: 'string' } },
      { label: true }
    )
    const rawWatch = String(attrs.watch ?? label ?? '')
    const watch = rawWatch
      .split(/[\s,]+/)
      .map(k => k.trim())
      .filter(Boolean)
    const visitor = createSerializedDirectiveHandler(
      addError,
      'effect',
      ALLOWED_EFFECT_DIRECTIVES,
      ({ content }) => ({ watch, content })
    )
    return visitor(directive, p, i)
  }

  const handleOnExit: DirectiveHandler = (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    const [p, i] = pair
    if (getLastPassageId() !== getCurrentPassageId()) {
      resetDirectiveState()
    }
    if (isOnExitErrored()) {
      return removeNode(p, i)
    }
    if (isOnExitSeen()) {
      setOnExitError(true)
      const msg =
        'Multiple onExit directives in a single passage are not allowed'
      console.error(msg)
      addError(msg)
      return removeNode(p, i)
    }
    setOnExitSeen(true)
    const visitor = createSerializedDirectiveHandler(
      addError,
      'onExit',
      ALLOWED_ONEXIT_DIRECTIVES,
      ({ content }) => ({ content })
    )
    return visitor(directive, p, i)
  }

  const handlePreset: DirectiveHandler = (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    const [p, i] = pair
    const { attrs: presetAttrs } = extractAttributes(
      directive,
      p,
      i,
      {
        type: { type: 'string', required: true },
        name: { type: 'string', required: true }
      },
      { label: false }
    )
    const target = String(presetAttrs.type)
    const name = String(presetAttrs.name)
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const rawAttrs = { ...attrs }
    delete rawAttrs.type
    delete rawAttrs.name
    const parsedAttrs: Record<string, unknown> = { ...rawAttrs }
    for (const key of Object.keys(parsedAttrs)) {
      const val = parsedAttrs[key]
      if (
        typeof val === 'number' ||
        (typeof val === 'string' && NUMERIC_PATTERN.test(val))
      ) {
        parsedAttrs[key] = parseNumericValue(val)
      }
    }
    setPreset(target, name, parsedAttrs)
    p.children.splice(i, 1)
    return i
  }

  return {
    show: handleShow,
    effect: handleEffect,
    onExit: handleOnExit,
    preset: handlePreset
  }
}
