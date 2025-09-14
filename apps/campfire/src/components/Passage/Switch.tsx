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
 * Evaluates a JavaScript expression against provided game data.
 *
 * @param expression - The expression to evaluate.
 * @param data - The game data used as scope for evaluation.
 * @returns The evaluated result or `undefined` on error.
 */
const evaluateExpression = (
  expression: string,
  data: Record<string, unknown>
) => {
  try {
    const fn = new Function(
      'data',
      `with (data) { return (${expression}) }`
    ) as (data: Record<string, unknown>) => unknown
    const proxy = new Proxy(data, {
      has: () => true,
      get: (obj, key) => (obj as Record<string, unknown>)[key as string]
    })
    return fn(proxy)
  } catch {
    return undefined
  }
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
          // Note: The Switch component is intentionally omitted from the components map to prevent a circular reference.
          // Including Switch here would allow nested Switch components to recursively render each other, leading to infinite recursion and a stack overflow.
          // This design choice ensures that Switch components cannot be rendered within the content processed by this processor.
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
  const value = evaluateExpression(test, gameData)
  const caseList: SwitchCase[] = JSON.parse(cases)
  let source: string | undefined
  for (const c of caseList) {
    const caseValue = evaluateExpression(c.test, gameData)
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
