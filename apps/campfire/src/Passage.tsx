import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as runtime from 'react/jsx-runtime'
import { jsxDEV as jsxDevRuntime } from 'react/jsx-dev-runtime'
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
          Fragment: runtime.Fragment,
          jsx: runtime.jsx,
          jsxs: runtime.jsxs,
          jsxDEV: jsxDevRuntime,
          development: process.env.NODE_ENV === 'development',
          components: {
            button: LinkButton,
            trigger: TriggerButton,
            if: If,
            show: Show
          }
        }),
    [handlers]
  )
  const passage = useStoryDataStore((state: StoryDataState) =>
    state.getCurrentPassage()
  )
  const [content, setContent] = useState<ReactNode>(null)
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
    if (name && !isTitleOverridden()) {
      document.title = name
    }
  }, [passage])

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
      const normalized = normalizeIfDirectives(text)
      if (controller.signal.aborted) return
      const file = await processor.process(normalized)
      if (controller.signal.aborted) return
      setContent(file.result as ReactNode)
    })()
    return () => controller.abort()
  }, [passage, processor])

  return <>{content}</>
}
