import { useMemo } from 'preact/hooks'
import { Fragment, jsx, jsxs } from 'preact/jsx-runtime'
import type { ComponentChild } from 'preact'
import { unified } from 'unified'
import remarkGfm from 'remark-gfm'
import remarkCampfire from '@/packages/remark-campfire'
import remarkRehype from 'remark-rehype'
import rehypeCampfire from '@/packages/rehype-campfire'
import rehypeReact from 'rehype-react'
import type { RootContent, Root } from 'mdast'
import { useGameStore } from '@/packages/use-game-store'
import { useDirectiveHandlers } from './useDirectiveHandlers'
import { LinkButton } from './LinkButton'
import { TriggerButton } from './TriggerButton'
import { Show } from './Show'
import { OnExit } from './OnExit'
import { Sequence, Step, Transition } from './Sequence'

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
  return result.result as ComponentChild
}
