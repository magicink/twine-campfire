import { useEffect, useState, type ReactNode } from 'react'
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
import {
  useStoryDataStore,
  type StoryDataState
} from '@/packages/use-story-data-store'
import { LinkButton } from './LinkButton'

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkDirective)
  .use(remarkCampfire)
  .use(remarkRehype)
  .use(rehypeCampfire)
  .use(rehypeReact, {
    Fragment: runtime.Fragment,
    jsx: runtime.jsx,
    jsxs: runtime.jsxs,
    jsxDEV,
    development: process.env.NODE_ENV === 'development',
    components: { button: LinkButton }
  })

export const Passage = () => {
  const passage = useStoryDataStore((state: StoryDataState) =>
    state.getCurrentPassage()
  )
  const [content, setContent] = useState<ReactNode>(null)

  useEffect(() => {
    const run = async () => {
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
      const file = await processor.process(text)
      setContent(file.result as ReactNode)
    }
    void run()
  }, [passage])

  return <>{content}</>
}
