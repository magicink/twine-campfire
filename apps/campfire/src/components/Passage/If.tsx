import { useMemo } from 'preact/hooks'
import { Fragment, jsx, jsxs } from 'preact/jsx-runtime'
import { isValidElement, type ComponentChild } from 'preact'
import { unified } from 'unified'
import remarkGfm from 'remark-gfm'
import remarkCampfire from '@campfire/remark-campfire'
import remarkRehype from 'remark-rehype'
import rehypeCampfire from '@campfire/rehype-campfire'
import rehypeReact from 'rehype-react'
import type { RootContent, Root } from 'mdast'
import { useGameStore } from '@campfire/state/useGameStore'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'
import { LinkButton } from '@campfire/components/Passage/LinkButton'
import { TriggerButton } from '@campfire/components/Passage/TriggerButton'
import { Show } from '@campfire/components/Passage/Show'
import { Translate } from '@campfire/components/Passage/Translate'
import { OnExit } from '@campfire/components/Passage/OnExit'
import {
  SlideReveal,
  SlideText,
  SlideImage,
  SlideShape
} from '@campfire/components/Deck/Slide'
import { rehypeSlideText } from '@campfire/utils/rehypeSlideText'

interface IfProps {
  test: string
  content: string
  fallback?: string
}

/**
 * Evaluates a JavaScript expression against game data and renders
 * serialized nodes when the expression is truthy or an optional
 * fallback when it is falsy.
 */
export const If = ({ test, content, fallback }: IfProps) => {
  const handlers = useDirectiveHandlers()
  const processor = useMemo(() => {
    const proc = unified()
      .use(remarkGfm)
      .use(remarkCampfire, { handlers })
      .use(remarkRehype)
      .use(rehypeCampfire)
      .use(rehypeSlideText)
      .use(rehypeReact, {
        Fragment,
        jsx,
        jsxs,
        components: {
          button: LinkButton,
          trigger: TriggerButton,
          if: If,
          show: Show,
          translate: Translate,
          onExit: OnExit,
          reveal: SlideReveal,
          slideText: SlideText,
          slideImage: SlideImage,
          slideShape: SlideShape
        }
      })
    proc.parser = (_doc: unknown, file: Root) => ({
      type: file.type,
      children: file.children
    })
    return proc
  }, [handlers])
  const gameData = useGameStore(state => state.gameData)
  let condition = false
  try {
    const fn = new Function('data', `with (data) { return (${test}) }`) as (
      data: Record<string, unknown>
    ) => unknown
    const proxy = new Proxy(gameData as Record<string, unknown>, {
      has: () => true,
      get: (obj, key) => (obj as Record<string, unknown>)[key as string]
    })
    condition = !!fn(proxy)
  } catch {
    condition = false
  }
  const source = condition ? content : fallback
  if (!source) return null
  const nodes: RootContent[] = JSON.parse(source)
  const root: Root = { type: 'root', children: nodes }
  const result = processor.processSync(root)
  const output = result.result
  /**
   * Runtime check to determine if a value is renderable by Preact.
   */
  const isComponentChild = (
    value: unknown
  ): value is ComponentChild | ComponentChild[] =>
    Array.isArray(value)
      ? value.every(isComponentChild)
      : value == null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        isValidElement(value)
  if (!isComponentChild(output)) return null
  return Array.isArray(output)
    ? jsxs(Fragment, { children: output })
    : (output as ComponentChild)
}
