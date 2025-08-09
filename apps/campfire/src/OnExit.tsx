import { useEffect, useMemo, useRef } from 'react'
import { unified } from 'unified'
import remarkCampfire, {
  remarkCampfireIndentation
} from '@/packages/remark-campfire'
import type { RootContent, Root } from 'mdast'
import rfdc from 'rfdc'
import { useDirectiveHandlers } from './useDirectiveHandlers'

const clone = rfdc()

/** Props for the `OnExit` component. */
interface OnExitProps {
  /** Serialized content to run when exiting a passage */
  content: string
}

/**
 * Executes serialized directive content once when unmounted.
 *
 * @param content - Serialized directive block to process on exit.
 */
export const OnExit = ({ content }: OnExitProps) => {
  const handlers = useDirectiveHandlers()
  const nodes = useMemo<RootContent[]>(
    () => clone(JSON.parse(content)),
    [content]
  )
  const ranRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * Processes a block of nodes with the Campfire remark plugins.
   *
   * @param block - Nodes to execute.
   */
  const runBlock = (block: RootContent[]) => {
    const root: Root = { type: 'root', children: block }
    unified()
      .use(remarkCampfireIndentation)
      .use(remarkCampfire, { handlers })
      .runSync(root)
  }

  useEffect(() => {
    return () => {
      timerRef.current = setTimeout(() => {
        if (!ranRef.current) {
          runBlock(nodes)
          ranRef.current = true
        }
      })
    }
  }, [nodes])

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  })

  return null
}
