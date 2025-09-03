import i18next from 'i18next'
import { toString } from 'mdast-util-to-string'
import type { RootContent, Text as MdText } from 'mdast'
import type { DirectiveHandler } from '@campfire/remark-campfire'
import type { ContainerDirective } from 'mdast-util-directive'
import type { Properties } from 'hast'
import type { DirectiveNode } from '@campfire/utils/directiveUtils'
import {
  extractAttributes,
  getLabel,
  hasLabel,
  removeNode,
  replaceWithIndentation
} from '@campfire/utils/directiveUtils'
import {
  getClassAttr,
  getStyleAttr,
  requireLeafDirective
} from '@campfire/utils/directiveHandlerUtils'
import {
  evalExpression,
  getTranslationOptions,
  interpolateString,
  QUOTE_PATTERN
} from '@campfire/utils/core'

/**
 * Context required to create i18n directive handlers.
 */
export interface I18nHandlerContext {
  /** Records an error message. */
  addError: (msg: string) => void
  /** Retrieves the latest game data snapshot. */
  getGameData: () => Record<string, unknown>
}

/**
 * Creates handlers for localization directives.
 *
 * @param ctx - Context providing state access and utilities.
 * @returns An object containing the i18n directive handlers.
 */
export const createI18nHandlers = (ctx: I18nHandlerContext) => {
  const { addError, getGameData } = ctx

  /**
   * Switches the active locale using `:lang[locale]`.
   *
   * @param directive - Directive node specifying the locale.
   * @param parent - Parent node of the directive.
   * @param index - Index of the directive within its parent.
   * @returns The new index after removing the directive.
   */
  const handleLang: DirectiveHandler = (directive, parent, index) => {
    const invalid = requireLeafDirective(directive, parent, index, addError)
    if (typeof invalid !== 'undefined') return invalid
    const locale = toString(directive).trim()

    // Basic locale validation: e.g., "en", "en-US", "fr", "zh-CN"
    const LOCALE_PATTERN = /^[a-z]{2,3}(-[A-Z][a-zA-Z]{1,7})?$/

    if (
      locale &&
      LOCALE_PATTERN.test(locale) &&
      i18next.isInitialized &&
      i18next.resolvedLanguage !== locale
    ) {
      void i18next.changeLanguage(locale)
    }

    return removeNode(parent, index)
  }

  /**
   * Adds a translation using shorthand `::translations[locale]{ns:key="value"}`.
   *
   * @param directive - The directive node representing the translations.
   * @param parent - The parent AST node containing this directive.
   * @param index - The index of the directive node within its parent.
   * @returns The new index after processing.
   */
  const handleTranslations: DirectiveHandler = (directive, parent, index) => {
    const invalid = requireLeafDirective(directive, parent, index, addError)
    if (typeof invalid !== 'undefined') return invalid
    const locale =
      getLabel(directive as ContainerDirective) || toString(directive).trim()
    const attrs = directive.attributes as Record<string, unknown>
    if (!locale?.trim() || !attrs) {
      const msg = 'Translations directive expects [locale]{ns:key="value"}'
      console.error(msg)
      addError(msg)
      return removeNode(parent, index)
    }
    const entries = Object.entries(attrs)
    if (entries.length !== 1) {
      const msg = 'Translations directive accepts only one namespace:key pair'
      console.error(msg)
      addError(msg)
      return removeNode(parent, index)
    }
    const [compound, raw] = entries[0]
    const m = compound.match(/^([^:]+):(.+)$/)
    if (m && typeof raw === 'string') {
      const ns = m[1]
      const key = m[2]
      const value = raw
      if (!i18next.hasResourceBundle(locale, ns)) {
        i18next.addResourceBundle(locale, ns, {}, true, true)
      }
      i18next.addResource(locale, ns, key, value)
    } else {
      const msg = 'Translations directive expects [locale]{ns:key="value"}'
      console.error(msg)
      addError(msg)
    }
    return removeNode(parent, index)
  }

  /**
   * Inserts a Show component that renders a translated string.
   * The directive label accepts `key` or `ns:key` and supports an optional
   * `count` attribute for pluralization.
   *
   * @param directive - The `t` directive node being processed.
   * @param parent - The parent AST node containing the directive.
   * @param index - The index of the directive within its parent.
   */
  const handleTranslate: DirectiveHandler = (directive, parent, index) => {
    let raw = ''
    let ns: string | undefined
    let key: string | undefined
    const label = hasLabel(directive) ? directive.label.trim() : undefined
    if (label) {
      raw = label
    } else {
      const children = directive.children as (RootContent & { name?: string })[]
      if (
        children.length === 2 &&
        children[0].type === 'text' &&
        children[1].type === 'textDirective'
      ) {
        ns = (children[0] as MdText).value.trim()
        key = (children[1] as DirectiveNode).name
        raw = `${ns}:${key}`
      } else if (children.length === 1 && children[0].type === 'text') {
        raw = (children[0] as MdText).value.trim()
      } else {
        raw = toString(directive).trim()
      }
    }
    if (!raw) return removeNode(parent, index)
    const gameData = getGameData()
    const { attrs } = extractAttributes(
      directive,
      parent,
      index,
      {
        count: { type: 'number' },
        fallback: { type: 'string' },
        ns: { type: 'string' },
        className: { type: 'string', expression: false },
        style: { type: 'string', expression: false }
      },
      { state: gameData }
    )
    if (attrs.ns) ns = attrs.ns
    const classAttr = getClassAttr(attrs, gameData)
    const styleAttr = getStyleAttr(attrs, gameData)
    const keyPattern = /^[A-Za-z_$][A-Za-z0-9_$]*(?::[A-Za-z0-9_.$-]+)?$/
    let props: Properties
    if (key || keyPattern.test(raw)) {
      if (!key) {
        const [nsPart, keyPart] = raw.split(':', 2)
        key = keyPart ?? nsPart
        if (keyPart !== undefined) ns = nsPart
      }
      props = { 'data-i18n-key': key }
      if (ns) props['data-i18n-ns'] = ns
    } else {
      props = { 'data-i18n-expr': raw }
    }
    const rawAttrs = { ...(directive.attributes || {}) } as Record<
      string,
      unknown
    >
    if (Object.prototype.hasOwnProperty.call(rawAttrs, 'class')) {
      const msg = 'class is a reserved attribute. Use className instead.'
      console.error(msg)
      addError(msg)
    }
    const rawFallback = rawAttrs.fallback as string | undefined
    delete rawAttrs.count
    delete rawAttrs.fallback
    delete rawAttrs.ns
    delete rawAttrs.className
    delete rawAttrs.style
    const vars: Record<string, unknown> = {}
    for (const [name, rawVal] of Object.entries(rawAttrs)) {
      if (rawVal == null) continue
      if (typeof rawVal === 'string') {
        try {
          const value = evalExpression(rawVal, gameData)
          vars[name] = value ?? rawVal
        } catch (error) {
          const msg = `Failed to evaluate t directive var: ${rawVal}`
          console.error(msg, error)
          addError(msg)
          const match = rawVal.match(QUOTE_PATTERN)
          vars[name] = match ? match[2] : rawVal
        }
      } else {
        vars[name] = rawVal
      }
    }
    let fallback: string | undefined
    if (typeof rawFallback === 'string') {
      const trimmed = rawFallback.trim()
      const match = trimmed.match(QUOTE_PATTERN)
      const inner = match ? match[2] : trimmed
      try {
        const shouldInterpolate = !!match || trimmed.includes('${')
        fallback = shouldInterpolate
          ? interpolateString(inner, gameData)
          : ((): string | undefined => {
              const val = evalExpression(inner, gameData)
              return val != null ? String(val) : undefined
            })()
      } catch (error) {
        const msg = `Failed to evaluate t directive fallback: ${rawFallback}`
        console.error(msg, error)
        addError(msg)
        fallback = match ? inner : trimmed
      }
    }
    if (parent && typeof index === 'number') {
      const prev = parent.children[index - 1] as MdText | undefined
      const next = parent.children[index + 1] as MdText | undefined
      const inLink =
        prev?.type === 'text' &&
        prev.value.endsWith('[[') &&
        next?.type === 'text' &&
        next.value.includes(']]')
      let nsVal = props['data-i18n-ns'] as string | undefined
      let tKey = props['data-i18n-key'] as string | undefined
      if (!tKey && 'data-i18n-expr' in props) {
        try {
          const result = evalExpression(
            props['data-i18n-expr'] as string,
            gameData
          )
          if (typeof result === 'string') {
            if (!nsVal && result.includes(':')) {
              ;[nsVal, tKey] = result.split(':', 2)
            } else {
              tKey = result
            }
          }
        } catch (error) {
          const msg = `Failed to evaluate t directive key expression: ${props['data-i18n-expr']}`
          console.error(msg, error)
          addError(msg)
          tKey = undefined
        }
      }
      const options = {
        ...vars,
        ...getTranslationOptions({ ns: nsVal, count: attrs.count })
      }
      if (inLink && tKey) {
        const text = i18next.t(tKey, options)
        if (prev && next) {
          prev.value += text + next.value
          parent.children.splice(index, 2)
          return index - 1
        }
        return replaceWithIndentation(directive, parent, index, [
          { type: 'text', value: text }
        ])
      }
      if (nsVal) props['data-i18n-ns'] = nsVal
      if (tKey) props['data-i18n-key'] = tKey
      if (attrs.count !== undefined) props['data-i18n-count'] = attrs.count
      if (Object.keys(vars).length > 0)
        props['data-i18n-vars'] = JSON.stringify(vars)
      if (fallback !== undefined) props['data-i18n-fallback'] = fallback
      if (classAttr) props.className = classAttr
      if (styleAttr) props.style = styleAttr
      const node: MdText = {
        type: 'text',
        value: '0',
        data: { hName: 'translate', hProperties: props }
      }
      return replaceWithIndentation(directive, parent, index, [node])
    }
    return index
  }

  return {
    lang: handleLang,
    translations: handleTranslations,
    t: handleTranslate
  }
}
