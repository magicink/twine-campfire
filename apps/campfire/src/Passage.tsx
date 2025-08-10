import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { Fragment, jsx, jsxs } from 'preact/jsx-runtime'
import type { ComponentChild } from 'preact'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import remarkCampfire from '@/packages/remark-campfire'
import remarkRehype from 'remark-rehype'
import rehypeCampfire from '@/packages/rehype-campfire'
import rehypeReact from 'rehype-react'
import type { Text, Content } from 'hast'
import { useDirectiveHandlers } from './useDirectiveHandlers'
import { isTitleOverridden, clearTitleOverride } from './titleState'
import {
  useStoryDataStore,
  type StoryDataState
} from '@/packages/use-story-data-store'
import { LinkButton } from './LinkButton'
import { TriggerButton } from './TriggerButton'
import { If } from './If'
import { Show } from './Show'
import { OnExit } from './OnExit'
import { Sequence, Step, Transition } from './Sequence'

const DIRECTIVE_MARKER_PATTERN = '(:::[^\\n]*|:[^\\n]*|<<)'

/**
 * Normalizes directive indentation so Markdown treats directive lines the same
 * regardless of leading spaces or tabs. Strips tabs or four-or-more spaces
 * before directive markers.
 *
 * @param input - Raw passage text.
 * @returns Passage text with directive indentation normalized.
 */
const normalizeDirectiveIndentation = (input: string): string =>
  input
    .replace(new RegExp(`^\\t+(?=(${DIRECTIVE_MARKER_PATTERN}))`, 'gm'), '')
    .replace(new RegExp(`^[ ]{4,}(?=(${DIRECTIVE_MARKER_PATTERN}))`, 'gm'), '')

/**
 * Converts legacy if directive syntax using braces into label-based directives.
 *
 * Remark's directive parser only accepts attribute names with characters valid
 * in HTML. Expressions like `!open` or `a < b` therefore cause the `:::if`
 * block to be treated as plain text. By converting `:::if{expr}` to
 * `:::if[expr]`, the expression is moved into the directive label where any
 * characters are allowed, enabling complex JavaScript conditions. Supports
 * directives with leading whitespace and expressions containing nested braces.
 */
const normalizeIfDirectives = (input: string): string =>
  input
    .split('\n')
    .map(line => {
      const trimmed = line.trimStart()
      if (!trimmed.startsWith(':::if{')) return line
      const indent = line.slice(0, line.length - trimmed.length)
      const after = trimmed.slice(':::if{'.length)
      let depth = 1
      let expr = ''
      let i = 0
      for (; i < after.length; i++) {
        const char = after[i]
        if (char === '{') {
          depth++
          expr += char
        } else if (char === '}') {
          depth--
          if (depth === 0) break
          expr += char
        } else {
          expr += char
        }
      }
      if (depth !== 0) return line
      const rest = after.slice(i + 1)
      return `${indent}:::if[${expr}]${rest}`
    })
    .join('\n')

/**
 * Builds a document title from story and passage names.
 *
 * @param storyName - Name of the story.
 * @param passageName - Name of the current passage.
 * @param separator - String used to separate story and passage names.
 * @param showPassage - Whether to include the passage name in the title.
 * @returns Formatted document title.
 */
const buildTitle = (
  storyName: string | undefined,
  passageName: string | undefined,
  separator: string,
  showPassage: boolean
): string => {
  if (!storyName) return passageName ?? ''
  if (!showPassage || !passageName) return storyName
  return `${storyName}${separator}${passageName}`
}

/**
 * Renders the current passage from the story data store.
 * The passage text is processed with Remark and Rehype plugins
 * to support Campfire directives and custom components.
 */
export const Passage = () => {
  const handlers = useDirectiveHandlers()
  const processor = useMemo(
    () =>
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkDirective)
        .use(remarkCampfire, { handlers })
        .use(remarkRehype)
        .use(rehypeCampfire)
        .use(rehypeReact, {
          Fragment,
          jsx,
          jsxs,
          components: {
            button: LinkButton,
            trigger: TriggerButton,
            if: If,
            show: Show,
            onExit: OnExit,
            sequence: Sequence,
            step: Step,
            transition: Transition
          }
        }),
    [handlers]
  )
  const passage = useStoryDataStore((state: StoryDataState) =>
    state.getCurrentPassage()
  )
  const storyData = useStoryDataStore(
    (state: StoryDataState) => state.storyData
  )
  const [content, setContent] = useState<ComponentChild | null>(null)
  const prevPassageId = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!passage) return
    const id =
      typeof passage.properties?.pid === 'string'
        ? passage.properties.pid
        : undefined
    const isNewPassage = prevPassageId.current !== id
    if (isNewPassage) {
      prevPassageId.current = id
      clearTitleOverride()
    }
    const name =
      typeof passage.properties?.name === 'string'
        ? passage.properties.name
        : undefined
    if (!isTitleOverridden()) {
      const storyName =
        typeof storyData.name === 'string' ? storyData.name : undefined
      const separator =
        typeof storyData['title-separator'] === 'string'
          ? (storyData['title-separator'] as string)
          : ': '
      const showPassage =
        storyData['title-show-passage'] !== 'false' &&
        storyData['title-show-passage'] !== false
      const title = buildTitle(storyName, name, separator, showPassage)
      if (title) {
        document.title = title
      }
    }
  }, [passage, storyData])

  useEffect(() => {
    const controller = new AbortController()
    ;(async () => {
      if (controller.signal.aborted) return
      if (!passage) {
        setContent(null)
        return
      }
      const text = passage.children
        .map((child: Content) =>
          child.type === 'text' && typeof child.value === 'string'
            ? (child as Text).value
            : ''
        )
        .join('')
      const normalized = normalizeIfDirectives(
        normalizeDirectiveIndentation(text)
      )
      if (controller.signal.aborted) return
      const file = await processor.process(normalized)
      if (controller.signal.aborted) return
      setContent(file.result as ComponentChild)
    })()
    return () => controller.abort()
  }, [passage, processor])

  return <>{content}</>
}
