import { visit } from 'unist-util-visit'
import type { Root, Parent, Paragraph, Text, InlineCode } from 'mdast'
import type { Node, Data } from 'unist'
import type {
  ContainerDirective,
  LeafDirective,
  TextDirective
} from 'mdast-util-directive'
import type { SKIP } from 'unist-util-visit'
import type { VFile } from 'vfile'

export type DirectiveNode = ContainerDirective | LeafDirective | TextDirective

/** Error message for unquoted trigger labels */
const MSG_TRIGGER_LABEL_UNQUOTED = 'trigger label must be a quoted string'
/** Error message for unquoted slide transitions */
const MSG_SLIDE_TRANSITION_UNQUOTED = 'slide transition must be a quoted string'
/** Error message for unquoted id attributes */
const MSG_ID_UNQUOTED = 'id must be a quoted string'

export type DirectiveHandlerResult = number | [typeof SKIP, number] | void

export type DirectiveHandler = (
  directive: DirectiveNode,
  parent: Parent | undefined,
  index: number | undefined
) => DirectiveHandlerResult

export interface RemarkCampfireOptions {
  handlers?: Record<string, DirectiveHandler>
}

export interface IncludeAttributes {
  /** Passage name to include */
  name?: string
  /** Passage id to include */
  pid?: string
}

export interface IncludeDirective extends Omit<LeafDirective, 'attributes'> {
  name: 'include'
  attributes?: IncludeAttributes
}

export interface LangDirective extends Omit<TextDirective, 'attributes'> {
  name: 'lang'
}

/** RegExp matching safe characters in directive attribute values. */
const SAFE_ATTR_VALUE_PATTERN = /^[\w\s.,'"`{}\[\]$!-]*$/

// TODO(campfire): Add comprehensive directive regression tests here:
// - Attribute quoting rules (quoted stays string; state-key allowances)
// - Marker-only paragraphs/text are preserved for handlers to delimit blocks
// - Deck/slide/wrapper/trigger end-of-block detection remains robust with
//   blank lines and mixed whitespace

/**
 * Data structure for paragraph nodes that may include custom hast element
 * metadata.
 */
interface ParagraphData extends Data {
  /** Custom element name applied by rehype */
  hName?: string
}

type ParagraphWithData = Paragraph & { data?: ParagraphData }

/**
 * Attaches indentation information to directive nodes by capturing trailing
 * whitespace from the preceding text node.
 */
export const remarkCampfireIndentation = () => (tree: Root) => {
  visit(
    tree,
    (node: Node, index: number | undefined, parent: Parent | undefined) => {
      if (node.type === 'text' && parent && typeof index === 'number') {
        const next = parent.children[index + 1]
        if (
          next &&
          (next.type === 'textDirective' ||
            next.type === 'leafDirective' ||
            next.type === 'containerDirective')
        ) {
          const textNode = node as Text
          const match = textNode.value.match(/(\s+)$/)
          if (match && match[1]) {
            textNode.value = textNode.value.slice(0, -match[1].length)
            const directive = next as DirectiveNode
            if (!directive.data) directive.data = {}
            ;(directive.data as Record<string, unknown>).indentation = match[1]
          }
        }
      }
    }
  )
}

/**
 * Extracts attributes from a trailing text node when `remark-directive` fails to
 * parse them, enabling support for characters like quotes within attribute
 * values. Only parses values that match a safe character pattern to reduce
 * injection risks.
 *
 * @param directive - Directive node being processed.
 * @param parent - Parent node containing the directive.
 * @param index - Index of the directive within its parent.
 */
const parseFallbackAttributes = (
  directive: DirectiveNode,
  parent: Parent,
  index: number
) => {
  const next = parent.children[index + 1]
  if (!next) return
  if (next.type === 'text') {
    const textNode = next as Text
    const match = textNode.value.match(/^\{([\w-]+)=([^}]*)\}$/)
    if (match) {
      const [, name, raw] = match
      if (SAFE_ATTR_VALUE_PATTERN.test(raw)) {
        directive.attributes = { [name]: raw }
        parent.children.splice(index + 1, 1)
      } else {
        directive.attributes = undefined
      }
      return
    }
    const open = textNode.value.match(/^\{([\w-]+)=$/)
    const codeNode = parent.children[index + 2]
    const close = parent.children[index + 3]
    if (
      open &&
      codeNode &&
      codeNode.type === 'inlineCode' &&
      close &&
      close.type === 'text' &&
      close.value === '}'
    ) {
      const [, name] = open
      const raw = (codeNode as InlineCode).value
      if (SAFE_ATTR_VALUE_PATTERN.test(raw)) {
        directive.attributes = { [name]: raw }
      }
      parent.children.splice(index + 1, 3)
    }
  }
}

/**
 * Matches a state key reference consisting of an identifier followed by
 * dot-access or numeric index segments (e.g., `user.name`, `items[0]`).
 */
const STATE_KEY_PATTERN = /^[a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*|\[\d+\])+$/

/** Cache of attribute name regex pairs to avoid recompilation. */
const ATTRIBUTE_REGEX_CACHE = new Map<
  string,
  { quoted: RegExp; unquoted: RegExp }
>()

/**
 * Retrieves compiled regular expressions for the given attribute name.
 *
 * @param name - Attribute name to create patterns for.
 * @returns Cached regular expressions for quoted and unquoted matches.
 */
const getAttributeRegex = (name: string) => {
  let cached = ATTRIBUTE_REGEX_CACHE.get(name)
  if (!cached) {
    cached = {
      quoted: new RegExp(`${name}\\s*=\\s*(['"\`])((?:\\\\.|(?!\\1).)*)\\1`),
      unquoted: new RegExp(`${name}\\s*=\\s*([^\\s}]+)`)
    }
    ATTRIBUTE_REGEX_CACHE.set(name, cached)
  }
  return cached
}

/**
 * Ensures that a directive attribute is a quoted string unless it references a
 * state key.
 *
 * @param directive - Directive node being processed.
 * @param name - Attribute name to verify.
 * @param file - VFile used for error reporting.
 * @param message - Error message to emit when validation fails.
 * @param allowStateKey - Whether unquoted state keys are permitted.
 */
const ensureQuotedAttribute = (
  directive: DirectiveNode,
  name: string,
  file: VFile,
  message: string,
  allowStateKey = false
) => {
  // TODO(campfire): Performance: avoid repeatedly slicing file.value and
  // re-compiling regex per directive. Consider passing the raw directive
  // substring into the handler or caching a precomputed map of offsets.
  const content = typeof file.value === 'string' ? file.value : undefined
  if (content) {
    const raw = content.slice(
      directive.position?.start.offset ?? 0,
      directive.position?.end.offset ?? 0
    )
    const { quoted: quotedRegex, unquoted: unquotedRegex } =
      getAttributeRegex(name)
    const quotedMatch = raw.match(quotedRegex)
    const attrs = directive.attributes as Record<string, unknown>
    if (typeof attrs[name] !== 'string') {
      delete attrs[name]
      file.message(message, directive)
      return
    }
    if (!quotedMatch) {
      if (allowStateKey) {
        const unquotedMatch = raw.match(unquotedRegex)
        if (unquotedMatch && STATE_KEY_PATTERN.test(unquotedMatch[1])) return
      }
      delete attrs[name]
      file.message(message, directive)
    }
  } else {
    const attrs = directive.attributes as Record<string, unknown>
    if (typeof attrs[name] !== 'string') {
      delete attrs[name]
      file.message(message, directive)
    }
  }
}

const remarkCampfire =
  (options: RemarkCampfireOptions = {}) =>
  (tree: Root, file: VFile) => {
    visit(
      tree,
      (node: Node, index: number | undefined, parent: Parent | undefined) => {
        if (
          node &&
          (node.type === 'textDirective' ||
            node.type === 'leafDirective' ||
            node.type === 'containerDirective')
        ) {
          const directive = node as DirectiveNode
          if (
            (!directive.attributes ||
              Object.keys(directive.attributes).length === 0) &&
            parent &&
            typeof index === 'number'
          ) {
            parseFallbackAttributes(directive, parent, index)
          }
          if (directive.attributes) {
            if (
              directive.name === 'trigger' &&
              Object.prototype.hasOwnProperty.call(
                directive.attributes,
                'label'
              )
            ) {
              ensureQuotedAttribute(
                directive,
                'label',
                file,
                MSG_TRIGGER_LABEL_UNQUOTED
              )
            }
            if (
              directive.name === 'slide' &&
              Object.prototype.hasOwnProperty.call(
                directive.attributes,
                'transition'
              )
            ) {
              ensureQuotedAttribute(
                directive,
                'transition',
                file,
                MSG_SLIDE_TRANSITION_UNQUOTED
              )
            }
            if (
              directive.attributes &&
              Object.prototype.hasOwnProperty.call(directive.attributes, 'id')
            ) {
              ensureQuotedAttribute(
                directive,
                'id',
                file,
                MSG_ID_UNQUOTED,
                true
              )
            }
            if (directive.name === 'deck') {
              for (const child of directive.children ?? []) {
                if (
                  child &&
                  (child.type === 'containerDirective' ||
                    child.type === 'leafDirective') &&
                  child.name === 'slide' &&
                  child.attributes &&
                  Object.prototype.hasOwnProperty.call(
                    child.attributes,
                    'transition'
                  )
                ) {
                  ensureQuotedAttribute(
                    child as DirectiveNode,
                    'transition',
                    file,
                    MSG_SLIDE_TRANSITION_UNQUOTED
                  )
                }
              }
            }
          }
          const handler = options.handlers?.[directive.name]
          if (handler) {
            return handler(directive, parent, index)
          }
        }
      }
    )

    visit(
      tree,
      (node: Node, index: number | undefined, parent: Parent | undefined) => {
        if (node.type === 'paragraph' && parent && typeof index === 'number') {
          const paragraph = node as ParagraphWithData
          // Preserve paragraphs transformed into custom elements
          if (paragraph.data?.hName) return
          // TODO(campfire): Do not remove marker-only paragraphs/text at the
          // remark stage. Double-check we only strip paragraphs that are truly
          // whitespace-only. Add regression tests for this sentinel.
          const hasContent = paragraph.children.some(child => {
            return !(
              child.type === 'text' && (child as Text).value.trim() === ''
            )
          })
          if (!hasContent) {
            parent.children.splice(index, 1)
            return index
          }
        }
      }
    )
  }

export default remarkCampfire
