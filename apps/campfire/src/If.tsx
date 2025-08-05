import { useMemo, type ReactNode } from 'react'
import * as runtime from 'react/jsx-runtime'
import { jsxDEV } from 'react/jsx-dev-runtime'
import { unified } from 'unified'
import remarkCampfire from '@/packages/remark-campfire'
import remarkRehype from 'remark-rehype'
import rehypeCampfire from '@/packages/rehype-campfire'
import rehypeReact from 'rehype-react'
import type { RootContent, Root } from 'mdast'
import { compile } from 'expression-eval'
import { useGameStore } from '@/packages/use-game-store'
import { useDirectiveHandlers } from './useDirectiveHandlers'
import { LinkButton } from './LinkButton'
import { TriggerButton } from './TriggerButton'

interface IfProps {
  test: string
  content: string
  fallback?: string
}

export const If = ({ test, content, fallback }: IfProps) => {
  const handlers = useDirectiveHandlers()
  const processor = useMemo(
    () =>
      unified()
        .use(remarkCampfire, { handlers })
        .use(remarkRehype)
        .use(rehypeCampfire)
        .use(rehypeReact, {
          Fragment: runtime.Fragment,
          jsx: runtime.jsx,
          jsxs: runtime.jsxs,
          jsxDEV,
          development: process.env.NODE_ENV === 'development',
          components: { button: LinkButton, trigger: TriggerButton, if: If }
        }),
    [handlers]
  )
  const gameData = useGameStore(state => state.gameData)
  let condition = false
  try {
    const fn = compile(test)
    condition = !!fn(gameData as any)
  } catch {
    condition = false
  }
  const source = condition ? content : fallback
  if (!source) return null
  const nodes: RootContent[] = JSON.parse(source)
  const root: Root = { type: 'root', children: nodes }
  const tree = processor.runSync(root)
  return processor.stringify(tree) as ReactNode
}
