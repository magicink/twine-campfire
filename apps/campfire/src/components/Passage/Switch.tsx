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
import { SlideReveal } from '@campfire/components/Deck/Slide/SlideReveal'
import {
  SlideText,
  SlideImage,
  SlideShape,
  SlideEmbed
} from '@campfire/components/Deck/Slide/SlideElements'
import { rehypeSlideText } from '@campfire/utils/rehypeSlideText'
import { If } from '@campfire/components/Passage/If'

interface SwitchCase {
  test: string
  content: string
}

interface SwitchProps {
  test: string
  cases: string
  fallback?: string
}

/**
 * Evaluates a JavaScript expression against game data and renders the
 * content of the first matching case or an optional fallback when no cases match.
 */
export const Switch = ({ test, cases, fallback }: SwitchProps) => {
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
          switch: Switch,
          show: Show,
          translate: Translate,
          onExit: OnExit,
          reveal: SlideReveal,
          slideText: SlideText,
          slideImage: SlideImage,
          slideShape: SlideShape,
          slideEmbed: SlideEmbed
        }
      })
    proc.parser = (_doc: unknown, file: Root) => ({
      type: file.type,
      children: file.children
    })
    return proc
  }, [handlers])
  const gameData = useGameStore.use.gameData()
  let value: unknown
  try {
    const fn = new Function('data', `with (data) { return (${test}) }`) as (
      data: Record<string, unknown>
    ) => unknown
    const proxy = new Proxy(gameData as Record<string, unknown>, {
      has: () => true,
      get: (obj, key) => (obj as Record<string, unknown>)[key as string]
    })
    value = fn(proxy)
  } catch {
    value = undefined
  }
  const caseList: SwitchCase[] = JSON.parse(cases)
  let source: string | undefined
  for (const c of caseList) {
    let caseValue: unknown
    try {
      const fn = new Function('data', `with (data) { return (${c.test}) }`) as (
        data: Record<string, unknown>
      ) => unknown
      const proxy = new Proxy(gameData as Record<string, unknown>, {
        has: () => true,
        get: (obj, key) => (obj as Record<string, unknown>)[key as string]
      })
      caseValue = fn(proxy)
    } catch {
      caseValue = undefined
    }
    if (caseValue === value) {
      source = c.content
      break
    }
  }
  if (!source && fallback) source = fallback
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

export default Switch
