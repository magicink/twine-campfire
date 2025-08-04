import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type ReactNode
} from 'react'
import * as runtime from 'react/jsx-runtime'
import { jsxDEV } from 'react/jsx-dev-runtime'
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
import { useGameStore } from '@/packages/use-game-store'
import { LinkButton } from './LinkButton'
import { TriggerButton } from './TriggerButton'

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
          jsxDEV,
          development: process.env.NODE_ENV === 'development',
          components: {
            button: LinkButton,
            trigger: TriggerButton
          }
        }),
    [handlers]
  )
  const passage = useStoryDataStore((state: StoryDataState) =>
    state.getCurrentPassage()
  )
  const hash = useGameStore(state => state.hash)
  const [content, setContent] = useState<ReactNode>(null)
  const prevPassageId = useRef<string | undefined>(undefined)
  const processingRef = useRef(false)
  const renderIdRef = useRef(0)
  const pendingRef = useRef(false)
  const renderRef = useRef<(() => Promise<void>) | null>(null)

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

  const renderPassage = useCallback(async () => {
    if (processingRef.current) {
      pendingRef.current = true
      return
    }
    processingRef.current = true
    pendingRef.current = false
    const id = ++renderIdRef.current
    if (!passage) {
      setContent(null)
      processingRef.current = false
      if (pendingRef.current && renderRef.current) void renderRef.current()
      return
    }
    const text = passage.children
      .map((child: Content) =>
        child.type === 'text' && typeof child.value === 'string'
          ? (child as Text).value
          : ''
      )
      .join('')
    const file = await processor.process(text)
    if (renderIdRef.current === id) {
      setContent(file.result as ReactNode)
    }
    processingRef.current = false
    if (pendingRef.current && renderRef.current) void renderRef.current()
  }, [passage, processor])

  useEffect(() => {
    renderRef.current = renderPassage
  }, [renderPassage])

  useEffect(() => {
    void renderPassage()
  }, [renderPassage])

  useEffect(() => {
    if (processingRef.current) return
    void renderPassage()
  }, [hash, renderPassage])

  return <>{content}</>
}
