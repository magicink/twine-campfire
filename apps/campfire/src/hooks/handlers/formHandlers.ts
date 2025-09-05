import { SKIP } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import type { Parent, Paragraph, RootContent, Text as MdText } from 'mdast'
import type { ContainerDirective } from 'mdast-util-directive'
import type { DirectiveHandler } from '@campfire/remark-campfire'
import type { Properties } from 'hast'
import {
  ensureKey,
  getLabel,
  hasLabel,
  stripLabel,
  expandIndentedCode,
  replaceWithIndentation,
  runDirectiveBlock,
  parseAttributeValue,
  isDirectiveNode,
  removeNode
} from '@campfire/utils/directiveUtils'
import {
  applyAdditionalAttributes,
  getClassAttr,
  getStyleAttr,
  removeDirectiveMarker,
  isMarkerParagraph,
  ensureParentIndex
} from '@campfire/utils/directiveHandlerUtils'
import { isWhitespaceRootContent } from '@campfire/utils/nodePredicates'

const DIRECTIVE_MARKER = ':::'

export interface FormHandlerContext {
  addError: (msg: string) => void
  getGameData: () => Record<string, unknown>
  interactiveEvents: Set<string>
  handleWrapper: DirectiveHandler
}
/**
 * Creates handlers for form and interactive directives.
 *
 * @param ctx - Context providing utilities and state access.
 * @returns An object containing the form directive handlers.
 */

export const createFormHandlers = (ctx: FormHandlerContext) => {
  const { addError, getGameData, interactiveEvents, handleWrapper } = ctx

  const isMarkerText = (node: RootContent): boolean => {
    if (node.type !== 'text') return false
    const stripped = (node as MdText).value.replace(/\s+/g, '')
    if (!stripped) return false
    const parts = stripped.split(DIRECTIVE_MARKER)
    return parts.every(part => part === '')
  }

  const extractEventProps = (
    nodes: RootContent[]
  ): { events: Record<string, string>; remaining: RootContent[] } => {
    const events: Record<string, string> = {}
    const remaining: RootContent[] = []
    for (const node of nodes) {
      if (
        node.type === 'containerDirective' &&
        interactiveEvents.has((node as ContainerDirective).name)
      ) {
        const name = (node as ContainerDirective).name
        events[name] = JSON.stringify(
          stripLabel((node as ContainerDirective).children as RootContent[])
        )
      } else if (!isWhitespaceRootContent(node)) {
        remaining.push(node)
      }
    }
    return { events, remaining }
  }

  const handleInput: DirectiveHandler = (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    const [p, i] = pair
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const typeAttr = typeof attrs.type === 'string' ? attrs.type : undefined
    if (typeAttr === 'checkbox') {
      delete attrs.type
      return handleCheckbox(directive, p, i)
    }
    if (typeAttr === 'radio') {
      delete attrs.type
      return handleRadio(directive, p, i)
    }
    if (directive.type === 'textDirective') {
      const label = hasLabel(directive) ? directive.label : toString(directive)
      const key = ensureKey(label.trim(), p, i)
      if (!key) return i
      if (Object.prototype.hasOwnProperty.call(attrs, 'class')) {
        const msg = 'class is a reserved attribute. Use className instead.'
        console.error(msg)
        addError(msg)
      }
      const classAttr = getClassAttr(attrs, getGameData())
      const styleAttr = getStyleAttr(attrs, getGameData())
      const placeholder =
        typeof attrs.placeholder === 'string' ? attrs.placeholder : undefined
      const initialValue =
        typeof attrs.value === 'string'
          ? attrs.value
          : typeof attrs.defaultValue === 'string'
            ? attrs.defaultValue
            : undefined
      const props: Record<string, unknown> = { stateKey: key }
      if (classAttr) props.className = classAttr.split(/\s+/).filter(Boolean)
      if (styleAttr) props.style = styleAttr
      if (placeholder) props.placeholder = placeholder
      if (initialValue) props.initialValue = initialValue
      applyAdditionalAttributes(
        attrs,
        props,
        ['className', 'style', 'placeholder', 'type', 'value', 'defaultValue'],
        addError
      )
      const node: Parent = {
        type: 'paragraph',
        children: [],
        data: { hName: 'input', hProperties: props as Properties }
      }
      return replaceWithIndentation(directive, p, i, [node as RootContent])
    }
    if (directive.type === 'containerDirective') {
      const container = directive as ContainerDirective
      const label = getLabel(container)
      const key = ensureKey(label.trim(), p, i)
      if (!key) return i
      if (Object.prototype.hasOwnProperty.call(attrs, 'class')) {
        const msg = 'class is a reserved attribute. Use className instead.'
        console.error(msg)
        addError(msg)
      }
      const classAttr = getClassAttr(attrs, getGameData())
      const styleAttr = getStyleAttr(attrs, getGameData())
      const placeholder =
        typeof attrs.placeholder === 'string' ? attrs.placeholder : undefined
      const initialValue =
        typeof attrs.value === 'string'
          ? attrs.value
          : typeof attrs.defaultValue === 'string'
            ? attrs.defaultValue
            : undefined
      const rawChildren = runDirectiveBlock(
        expandIndentedCode(container.children as RootContent[])
      )
      const { events } = extractEventProps(rawChildren)

      const start = i + 1
      const extras: RootContent[] = []
      let cursor = start
      while (cursor < p.children.length) {
        const sib = p.children[cursor] as RootContent
        if (
          sib.type === 'containerDirective' &&
          interactiveEvents.has((sib as ContainerDirective).name)
        ) {
          extras.push(sib)
          p.children.splice(cursor, 1)
          continue
        }
        if (isMarkerParagraph(sib) || isMarkerText(sib)) {
          p.children.splice(cursor, 1)
        }
        break
      }
      if (extras.length) {
        const { events: extraEvents } = extractEventProps(extras)
        Object.assign(events, extraEvents)
      }
      const props: Record<string, unknown> = { stateKey: key }
      if (classAttr) props.className = classAttr.split(/\s+/).filter(Boolean)
      if (styleAttr) props.style = styleAttr
      if (placeholder) props.placeholder = placeholder
      if (initialValue) props.initialValue = initialValue
      if (events.onMouseEnter) props.onMouseEnter = events.onMouseEnter
      if (events.onMouseLeave) props.onMouseLeave = events.onMouseLeave
      if (events.onFocus) props.onFocus = events.onFocus
      if (events.onBlur) props.onBlur = events.onBlur
      applyAdditionalAttributes(
        attrs,
        props,
        ['className', 'style', 'placeholder', 'type', 'value', 'defaultValue'],
        addError
      )
      const node: Parent = {
        type: 'paragraph',
        children: [],
        data: { hName: 'input', hProperties: props as Properties }
      }
      const newIndex = replaceWithIndentation(directive, p, i, [
        node as RootContent
      ])
      const markerIndex = newIndex + 1
      removeDirectiveMarker(p, markerIndex)
      return [SKIP, newIndex]
    }
    const msg = 'input can only be used as a leaf or container directive'
    console.error(msg)
    addError(msg)
    return removeNode(p, i)
  }

  const handleCheckbox: DirectiveHandler = (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    const [p, i] = pair
    if (directive.type === 'textDirective') {
      const label = hasLabel(directive) ? directive.label : toString(directive)
      const key = ensureKey(label.trim(), p, i)
      if (!key) return i
      const attrs = (directive.attributes || {}) as Record<string, unknown>
      if (Object.prototype.hasOwnProperty.call(attrs, 'class')) {
        const msg = 'class is a reserved attribute. Use className instead.'
        console.error(msg)
        addError(msg)
      }
      const classAttr = getClassAttr(attrs, getGameData())
      const styleAttr = getStyleAttr(attrs, getGameData())
      const initialValue =
        typeof attrs.value === 'string'
          ? attrs.value
          : typeof attrs.defaultValue === 'string'
            ? attrs.defaultValue
            : typeof attrs.checked === 'string'
              ? attrs.checked
              : undefined
      const props: Record<string, unknown> = { stateKey: key }
      if (classAttr) props.className = classAttr.split(/\s+/).filter(Boolean)
      if (styleAttr) props.style = styleAttr
      if (initialValue) props.initialValue = initialValue
      applyAdditionalAttributes(
        attrs,
        props,
        ['className', 'style', 'value', 'defaultValue', 'checked'],
        addError
      )
      const node: Parent = {
        type: 'paragraph',
        children: [],
        data: { hName: 'checkbox', hProperties: props as Properties }
      }
      return replaceWithIndentation(directive, p, i, [node as RootContent])
    }
    if (directive.type === 'containerDirective') {
      const container = directive as ContainerDirective
      const label = getLabel(container)
      const key = ensureKey(label.trim(), p, i)
      if (!key) return i
      const attrs = (container.attributes || {}) as Record<string, unknown>
      if (Object.prototype.hasOwnProperty.call(attrs, 'class')) {
        const msg = 'class is a reserved attribute. Use className instead.'
        console.error(msg)
        addError(msg)
      }
      const classAttr = getClassAttr(attrs, getGameData())
      const styleAttr = getStyleAttr(attrs, getGameData())
      const initialValue =
        typeof attrs.value === 'string'
          ? attrs.value
          : typeof attrs.defaultValue === 'string'
            ? attrs.defaultValue
            : typeof attrs.checked === 'string'
              ? attrs.checked
              : undefined
      const rawChildren = runDirectiveBlock(
        expandIndentedCode(container.children as RootContent[])
      )
      const { events } = extractEventProps(rawChildren)

      const start = i + 1
      const extras: RootContent[] = []
      let cursor = start
      while (cursor < p.children.length) {
        const sib = p.children[cursor] as RootContent
        if (
          sib.type === 'containerDirective' &&
          interactiveEvents.has((sib as ContainerDirective).name)
        ) {
          extras.push(sib)
          p.children.splice(cursor, 1)
          continue
        }
        if (isMarkerParagraph(sib) || isMarkerText(sib)) {
          p.children.splice(cursor, 1)
        }
        break
      }
      if (extras.length) {
        const { events: extraEvents } = extractEventProps(extras)
        Object.assign(events, extraEvents)
      }
      const props: Record<string, unknown> = { stateKey: key }
      if (classAttr) props.className = classAttr.split(/\s+/).filter(Boolean)
      if (styleAttr) props.style = styleAttr
      if (initialValue) props.initialValue = initialValue
      if (events.onMouseEnter) props.onMouseEnter = events.onMouseEnter
      if (events.onMouseLeave) props.onMouseLeave = events.onMouseLeave
      if (events.onFocus) props.onFocus = events.onFocus
      if (events.onBlur) props.onBlur = events.onBlur
      applyAdditionalAttributes(
        attrs,
        props,
        ['className', 'style', 'value', 'defaultValue', 'checked'],
        addError
      )
      const node: Parent = {
        type: 'paragraph',
        children: [],
        data: { hName: 'checkbox', hProperties: props as Properties }
      }
      const newIndex = replaceWithIndentation(directive, p, i, [
        node as RootContent
      ])
      const markerIndex = newIndex + 1
      removeDirectiveMarker(p, markerIndex)
      return [SKIP, newIndex]
    }
    const msg = 'checkbox can only be used as a leaf or container directive'
    console.error(msg)
    addError(msg)
    return removeNode(p, i)
  }

  const handleRadio: DirectiveHandler = (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    ;[parent, index] = pair
    if (directive.type === 'textDirective') {
      const label = hasLabel(directive) ? directive.label : toString(directive)
      const key = ensureKey(label.trim(), parent, index)
      if (!key) return index
      const attrs = (directive.attributes || {}) as Record<string, unknown>
      if (Object.prototype.hasOwnProperty.call(attrs, 'class')) {
        const msg = 'class is a reserved attribute. Use className instead.'
        console.error(msg)
        addError(msg)
      }
      const classAttr = getClassAttr(attrs, getGameData())
      const styleAttr = getStyleAttr(attrs, getGameData())
      const valueAttr = typeof attrs.value === 'string' ? attrs.value : ''
      const initialValue =
        typeof attrs.defaultValue === 'string'
          ? attrs.defaultValue
          : attrs.checked !== undefined
            ? valueAttr
            : undefined
      const props: Record<string, unknown> = {
        stateKey: key,
        value: valueAttr
      }
      if (classAttr) props.className = classAttr.split(/\s+/).filter(Boolean)
      if (styleAttr) props.style = styleAttr
      if (initialValue) props.initialValue = initialValue
      applyAdditionalAttributes(
        attrs,
        props,
        ['className', 'style', 'value', 'defaultValue', 'checked'],
        addError
      )
      const node: Parent = {
        type: 'emphasis',
        children: [],
        data: { hName: 'radio', hProperties: props as Properties }
      }
      return replaceWithIndentation(directive, parent, index, [
        node as unknown as RootContent
      ])
    }
    if (directive.type === 'containerDirective') {
      const container = directive as ContainerDirective
      const label = getLabel(container)
      const key = ensureKey(label.trim(), parent, index)
      if (!key) return index
      const attrs = (container.attributes || {}) as Record<string, unknown>
      if (Object.prototype.hasOwnProperty.call(attrs, 'class')) {
        const msg = 'class is a reserved attribute. Use className instead.'
        console.error(msg)
        addError(msg)
      }
      const classAttr = getClassAttr(attrs, getGameData())
      const styleAttr = getStyleAttr(attrs, getGameData())
      const valueAttr = typeof attrs.value === 'string' ? attrs.value : ''
      const initialValue =
        typeof attrs.defaultValue === 'string'
          ? attrs.defaultValue
          : attrs.checked !== undefined
            ? valueAttr
            : undefined
      const rawChildren = runDirectiveBlock(
        expandIndentedCode(container.children as RootContent[])
      )
      const { events } = extractEventProps(rawChildren)

      const start = index + 1
      const extras: RootContent[] = []
      let cursor = start
      while (cursor < parent.children.length) {
        const sib = parent.children[cursor] as RootContent
        if (
          sib.type === 'containerDirective' &&
          interactiveEvents.has((sib as ContainerDirective).name)
        ) {
          extras.push(sib)
          parent.children.splice(cursor, 1)
          continue
        }
        if (isMarkerParagraph(sib) || isMarkerText(sib)) {
          parent.children.splice(cursor, 1)
        }
        break
      }
      if (extras.length) {
        const { events: extraEvents } = extractEventProps(extras)
        Object.assign(events, extraEvents)
      }
      const props: Record<string, unknown> = {
        stateKey: key,
        value: valueAttr
      }
      if (classAttr) props.className = classAttr.split(/\s+/).filter(Boolean)
      if (styleAttr) props.style = styleAttr
      if (initialValue) props.initialValue = initialValue
      if (events.onMouseEnter) props.onMouseEnter = events.onMouseEnter
      if (events.onMouseLeave) props.onMouseLeave = events.onMouseLeave
      if (events.onFocus) props.onFocus = events.onFocus
      if (events.onBlur) props.onBlur = events.onBlur
      applyAdditionalAttributes(
        attrs,
        props,
        ['className', 'style', 'value', 'defaultValue', 'checked'],
        addError
      )
      const node: Parent = {
        type: 'paragraph',
        children: [],
        data: { hName: 'radio', hProperties: props as Properties }
      }
      const newIndex = replaceWithIndentation(directive, parent, index, [
        node as RootContent
      ])
      const markerIndex = newIndex + 1
      removeDirectiveMarker(parent, markerIndex)
      return [SKIP, newIndex]
    }
    const msg = 'radio can only be used as a leaf or container directive'
    console.error(msg)
    addError(msg)
    return removeNode(parent, index)
  }

  const handleTextarea: DirectiveHandler = (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    ;[parent, index] = pair
    if (directive.type === 'textDirective') {
      const label = hasLabel(directive) ? directive.label : toString(directive)
      const key = ensureKey(label.trim(), parent, index)
      if (!key) return index
      const attrs = (directive.attributes || {}) as Record<string, unknown>
      if (Object.prototype.hasOwnProperty.call(attrs, 'class')) {
        const msg = 'class is a reserved attribute. Use className instead.'
        console.error(msg)
        addError(msg)
      }
      const classAttr = getClassAttr(attrs, getGameData())
      const styleAttr = getStyleAttr(attrs, getGameData())
      const placeholder =
        typeof attrs.placeholder === 'string' ? attrs.placeholder : undefined
      const initialValue =
        typeof attrs.value === 'string'
          ? attrs.value
          : typeof attrs.defaultValue === 'string'
            ? attrs.defaultValue
            : undefined
      const props: Record<string, unknown> = { stateKey: key }
      if (classAttr) props.className = classAttr.split(/\s+/).filter(Boolean)
      if (styleAttr) props.style = styleAttr
      if (placeholder) props.placeholder = placeholder
      if (initialValue) props.initialValue = initialValue
      applyAdditionalAttributes(
        attrs,
        props,
        ['className', 'style', 'placeholder', 'value', 'defaultValue'],
        addError
      )
      const node: Parent = {
        type: 'paragraph',
        children: [],
        data: { hName: 'textarea', hProperties: props as Properties }
      }
      return replaceWithIndentation(directive, parent, index, [
        node as RootContent
      ])
    }
    if (directive.type === 'containerDirective') {
      const container = directive as ContainerDirective
      const label = getLabel(container)
      const key = ensureKey(label.trim(), parent, index)
      if (!key) return index
      const attrs = (container.attributes || {}) as Record<string, unknown>
      if (Object.prototype.hasOwnProperty.call(attrs, 'class')) {
        const msg = 'class is a reserved attribute. Use className instead.'
        console.error(msg)
        addError(msg)
      }
      const classAttr = getClassAttr(attrs, getGameData())
      const styleAttr = getStyleAttr(attrs, getGameData())
      const placeholder =
        typeof attrs.placeholder === 'string' ? attrs.placeholder : undefined
      const initialValue =
        typeof attrs.value === 'string'
          ? attrs.value
          : typeof attrs.defaultValue === 'string'
            ? attrs.defaultValue
            : undefined
      const rawChildren = runDirectiveBlock(
        expandIndentedCode(container.children as RootContent[])
      )
      const { events } = extractEventProps(rawChildren)

      const start = index + 1
      const extras: RootContent[] = []
      let cursor = start
      while (cursor < parent.children.length) {
        const sib = parent.children[cursor] as RootContent
        if (
          sib.type === 'containerDirective' &&
          interactiveEvents.has((sib as ContainerDirective).name)
        ) {
          extras.push(sib)
          parent.children.splice(cursor, 1)
          continue
        }
        if (isMarkerParagraph(sib) || isMarkerText(sib)) {
          parent.children.splice(cursor, 1)
        }
        break
      }
      if (extras.length) {
        const { events: extraEvents } = extractEventProps(extras)
        Object.assign(events, extraEvents)
      }

      const props: Record<string, unknown> = { stateKey: key }
      if (classAttr) props.className = classAttr.split(/\s+/).filter(Boolean)
      if (styleAttr) props.style = styleAttr
      if (placeholder) props.placeholder = placeholder
      if (initialValue) props.initialValue = initialValue
      if (events.onMouseEnter) props.onMouseEnter = events.onMouseEnter
      if (events.onMouseLeave) props.onMouseLeave = events.onMouseLeave
      if (events.onFocus) props.onFocus = events.onFocus
      if (events.onBlur) props.onBlur = events.onBlur
      applyAdditionalAttributes(
        attrs,
        props,
        ['className', 'style', 'placeholder', 'value', 'defaultValue'],
        addError
      )
      const node: Parent = {
        type: 'paragraph',
        children: [],
        data: { hName: 'textarea', hProperties: props as Properties }
      }
      const newIndex = replaceWithIndentation(directive, parent, index, [
        node as RootContent
      ])
      const markerIndex = newIndex + 1
      removeDirectiveMarker(parent, markerIndex)
      return [SKIP, newIndex]
    }
    const msg = 'textarea can only be used as a leaf or container directive'
    console.error(msg)
    addError(msg)
    return removeNode(parent, index)
  }

  const handleOption: DirectiveHandler = (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    ;[parent, index] = pair
    if (directive.type === 'textDirective') {
      const msg = 'option cannot be used as an inline directive'
      console.error(msg)
      addError(msg)
      return removeNode(parent, index)
    }
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    const rawValue = attrs.value
    const value = parseAttributeValue(
      rawValue,
      { type: 'string' },
      getGameData()
    )
    if (value == null || String(value) === '') {
      const msg = 'option requires a value attribute'
      console.error(msg)
      addError(msg)
      return removeNode(parent, index)
    }
    if (Object.prototype.hasOwnProperty.call(attrs, 'class')) {
      const msg = 'class is a reserved attribute. Use className instead.'
      console.error(msg)
      addError(msg)
    }
    const classAttr = getClassAttr(attrs, getGameData())
    const styleAttr = getStyleAttr(attrs, getGameData())
    const props: Record<string, unknown> = { value: String(value) }
    if (classAttr) props.className = classAttr.split(/\s+/).filter(Boolean)
    if (styleAttr) props.style = styleAttr
    applyAdditionalAttributes(
      attrs,
      props,
      ['value', 'label', 'className', 'style'],
      addError
    )

    if (directive.type === 'leafDirective') {
      const rawLabel = attrs.label
      const labelAttr = parseAttributeValue(
        rawLabel,
        { type: 'string' },
        getGameData()
      )
      if (labelAttr == null) {
        const msg = 'option leaf directives require a label attribute'
        console.error(msg)
        addError(msg)
        return removeNode(parent, index)
      }
      const node: Parent = {
        type: 'paragraph',
        children: [{ type: 'text', value: String(labelAttr) }],
        data: { hName: 'option', hProperties: props as Properties }
      }
      return replaceWithIndentation(directive, parent, index, [
        node as RootContent
      ])
    }

    const container = directive as ContainerDirective
    const rawChildren = runDirectiveBlock(
      expandIndentedCode(container.children as RootContent[])
    )
    const children = rawChildren.filter(node => !isWhitespaceRootContent(node))
    const node: Parent = {
      type: 'paragraph',
      children: children as RootContent[],
      data: { hName: 'option', hProperties: props as Properties }
    }
    const newIndex = replaceWithIndentation(directive, parent, index, [
      node as RootContent
    ])
    const markerIndex = newIndex + 1
    removeDirectiveMarker(parent, markerIndex)
    return [SKIP, newIndex]
  }

  const handleSelect: DirectiveHandler = (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    ;[parent, index] = pair
    const container = directive as ContainerDirective
    const label = getLabel(container)
    const key = ensureKey(label.trim(), parent, index)
    if (!key) return index
    const attrs = (container.attributes || {}) as Record<string, unknown>
    if (Object.prototype.hasOwnProperty.call(attrs, 'class')) {
      const msg = 'class is a reserved attribute. Use className instead.'
      console.error(msg)
      addError(msg)
    }
    const classAttr = getClassAttr(attrs, getGameData())
    const styleAttr = getStyleAttr(attrs, getGameData())
    const initialValue =
      typeof attrs.value === 'string'
        ? attrs.value
        : typeof attrs.defaultValue === 'string'
          ? attrs.defaultValue
          : undefined
    const rawChildren = runDirectiveBlock(
      expandIndentedCode(container.children as RootContent[])
    )
    const { events, remaining } = extractEventProps(rawChildren)

    const start = index + 1
    const extras: RootContent[] = []
    let cursor = start
    while (cursor < parent.children.length) {
      const sib = parent.children[cursor] as RootContent
      if (
        sib.type === 'containerDirective' &&
        interactiveEvents.has((sib as ContainerDirective).name)
      ) {
        extras.push(sib)
        parent.children.splice(cursor, 1)
        continue
      }
      if (isMarkerParagraph(sib) || isMarkerText(sib)) {
        parent.children.splice(cursor, 1)
      }
      break
    }
    if (extras.length) {
      const { events: extraEvents } = extractEventProps(extras)
      Object.assign(events, extraEvents)
    }

    const options = remaining.filter(node => !isWhitespaceRootContent(node))
    const props: Record<string, unknown> = { stateKey: key }
    if (classAttr) props.className = classAttr.split(/\s+/).filter(Boolean)
    if (styleAttr) props.style = styleAttr
    if (initialValue) props.initialValue = initialValue
    if (events.onMouseEnter) props.onMouseEnter = events.onMouseEnter
    if (events.onMouseLeave) props.onMouseLeave = events.onMouseLeave
    if (events.onFocus) props.onFocus = events.onFocus
    if (events.onBlur) props.onBlur = events.onBlur
    applyAdditionalAttributes(
      attrs,
      props,
      ['className', 'style', 'value', 'defaultValue'],
      addError
    )
    const node: Parent = {
      type: 'paragraph',
      children: options as RootContent[],
      data: { hName: 'select', hProperties: props as Properties }
    }
    const newIndex = replaceWithIndentation(directive, parent, index, [
      node as RootContent
    ])
    const markerIndex = newIndex + 1
    removeDirectiveMarker(parent, markerIndex)
    return [SKIP, newIndex]
  }

  const handleTrigger: DirectiveHandler = (directive, parent, index) => {
    const pair = ensureParentIndex(parent, index)
    if (!pair) return
    ;[parent, index] = pair
    const container = directive as ContainerDirective
    const attrs = (directive.attributes || {}) as Record<string, unknown>
    if (Object.prototype.hasOwnProperty.call(attrs, 'class')) {
      const msg = 'class is a reserved attribute. Use className instead.'
      console.error(msg)
      addError(msg)
    }
    const rawLabel = typeof attrs.label === 'string' ? attrs.label : undefined
    const evaluatedLabel =
      rawLabel && /[.()?:|&]/.test(rawLabel)
        ? (parseAttributeValue(rawLabel, { type: 'string' }, getGameData()) as
            | string
            | undefined)
        : rawLabel
    const defaultLabel = evaluatedLabel ?? getLabel(container)
    const classAttr = getClassAttr(attrs, getGameData())
    const disabledAttr = attrs.disabled
    const styleAttr = getStyleAttr(attrs, getGameData())
    const processedForLabel = runDirectiveBlock(
      expandIndentedCode(container.children as RootContent[]),
      { wrapper: handleWrapper }
    )
    const rawChildren = expandIndentedCode(container.children as RootContent[])
    const { events, remaining } = extractEventProps(rawChildren)
    const isProcessedWrapper = (node: RootContent): node is Paragraph => {
      if (node.type !== 'paragraph') return false
      const data = (node as Paragraph).data as
        | { hName?: unknown; hProperties?: Record<string, unknown> }
        | undefined
      if (!data || typeof data.hName !== 'string') return false
      const props = data.hProperties || {}
      const cls = props.className as unknown
      const classes = Array.isArray(cls)
        ? cls
        : typeof cls === 'string'
          ? cls.split(/\s+/).filter(Boolean)
          : []
      return classes.includes('campfire-wrapper')
    }
    type WrapperContainer = RootContent & {
      type: 'containerDirective'
      name: 'wrapper'
      attributes?: Record<string, unknown>
      children?: RootContent[]
    }
    const isRawWrapper = (node: RootContent): node is WrapperContainer =>
      (node as any)?.type === 'containerDirective' &&
      (node as any)?.name === 'wrapper'

    const wrappersProcessed = processedForLabel.filter(isProcessedWrapper)
    const wrappersRaw = remaining.filter(isRawWrapper)
    const totalWrappers = wrappersProcessed.length + wrappersRaw.length
    let labelNodes: RootContent[] | undefined
    let remainingAfterLabel = remaining.filter(
      n =>
        !isRawWrapper(n) &&
        !(n.type === 'text' && isMarkerText(n as RootContent))
    )

    if (totalWrappers > 0) {
      if (totalWrappers > 1) {
        const msg = 'Only one wrapper directive is allowed inside a trigger'
        console.error(msg)
        addError(msg)
      }
      if (wrappersProcessed.length > 0) {
        const first = wrappersProcessed[0]
        const data = first.data as
          | { hName?: unknown; hProperties?: Record<string, unknown> }
          | undefined
        if (data && typeof data.hName === 'string' && data.hName !== 'span') {
          const msg =
            'Wrapper inside trigger must use an inline tag allowed within <button> (e.g., as="span")'
          console.error(msg)
          addError(msg)
          data.hName = 'span'
        }
        labelNodes = [first as RootContent]
      } else {
        const first = wrappersRaw[0]
        const wattrs = (first.attributes || {}) as Record<string, unknown>
        const classAttr = getClassAttr(wattrs, getGameData())
        const labelEl: Parent = {
          type: 'paragraph',
          children: (first.children as RootContent[]) || [],
          data: {
            hName: 'span',
            hProperties: {
              'data-testid': 'wrapper',
              className: ['campfire-wrapper', classAttr]
                .filter(Boolean)
                .join(' ')
            }
          }
        }
        const flat: RootContent[] = []
        labelEl.children.forEach(child => {
          if (child.type === 'paragraph') {
            flat.push(
              ...((child as Paragraph).children as RootContent[]).filter(
                c => !isWhitespaceRootContent(c)
              )
            )
          } else if (!isWhitespaceRootContent(child)) {
            flat.push(child)
          }
        })
        labelEl.children = flat
        labelNodes = [labelEl as RootContent]
      }
    }

    const start = index + 1
    const siblings: RootContent[] = []
    let cursor = start
    let endMarker = -1
    while (cursor < parent.children.length) {
      const sib = parent.children[cursor] as RootContent
      if (isMarkerParagraph(sib) || isMarkerText(sib)) {
        endMarker = cursor
        break
      }
      if (isDirectiveNode(sib as unknown as Parent)) {
        endMarker = cursor - 1
        break
      }
      siblings.push(sib)
      cursor++
    }

    if (endMarker !== -1) {
      parent.children.splice(start, endMarker - start + 1)
    } else if (siblings.length) {
      parent.children.splice(start, siblings.length)
    }

    const { events: extraEvents, remaining: pendingRemaining } =
      extractEventProps(siblings)
    const pendingFiltered = pendingRemaining.filter(
      n => !isProcessedWrapper(n) && !isRawWrapper(n)
    )

    const finalContentNodes = stripLabel([
      ...(remainingAfterLabel as RootContent[]),
      ...pendingFiltered
    ])

    const classes = classAttr.split(/\s+/).filter(Boolean)
    const hProps: Record<string, unknown> = {
      className: classes,
      content: JSON.stringify(finalContentNodes),
      ...(disabledAttr !== undefined ? { disabled: disabledAttr } : {}),
      ...(styleAttr ? { style: styleAttr } : {})
    }
    if (events.onMouseEnter) hProps.onMouseEnter = events.onMouseEnter
    if (events.onMouseLeave) hProps.onMouseLeave = events.onMouseLeave
    if (events.onFocus) hProps.onFocus = events.onFocus
    if (events.onBlur) hProps.onBlur = events.onBlur
    if (!hProps.onMouseEnter && extraEvents.onMouseEnter)
      hProps.onMouseEnter = extraEvents.onMouseEnter
    if (!hProps.onMouseLeave && extraEvents.onMouseLeave)
      hProps.onMouseLeave = extraEvents.onMouseLeave
    if (!hProps.onFocus && extraEvents.onFocus)
      hProps.onFocus = extraEvents.onFocus
    if (!hProps.onBlur && extraEvents.onBlur) hProps.onBlur = extraEvents.onBlur

    const node: Parent = {
      type: 'paragraph',
      children:
        labelNodes && labelNodes.length
          ? (labelNodes as RootContent[])
          : ([{ type: 'text', value: defaultLabel || '' }] as RootContent[]),
      data: {
        hName: 'trigger',
        hProperties: hProps as Properties
      }
    }
    const newIndex = replaceWithIndentation(directive, parent, index, [
      node as RootContent
    ])
    return [SKIP, newIndex]
  }

  return {
    input: handleInput,
    checkbox: handleCheckbox,
    radio: handleRadio,
    textarea: handleTextarea,
    option: handleOption,
    select: handleSelect,
    trigger: handleTrigger
  }
}
