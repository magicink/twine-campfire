import { unified } from 'unified'
import remarkCampfire from '@/packages/remark-campfire'
import type { RootContent, Root } from 'mdast'
import rfdc from 'rfdc'
import { useDirectiveHandlers } from './useDirectiveHandlers'

const clone = rfdc()

interface TriggerButtonProps {
  className?: string | string[]
  content: string
  children?: string
  disabled?: boolean
}

export const TriggerButton = ({
  className,
  content,
  children,
  disabled
}: TriggerButtonProps) => {
  const handlers = useDirectiveHandlers()
  const runBlock = (nodes: RootContent[]) => {
    const root: Root = { type: 'root', children: nodes }
    unified().use(remarkCampfire, { handlers }).runSync(root)
  }
  const classes = Array.isArray(className)
    ? className
    : className
      ? [className]
      : []
  return (
    <button
      type='button'
      className={['campfire-trigger', ...classes].join(' ')}
      disabled={disabled}
      onClick={() => {
        runBlock(clone(JSON.parse(content)))
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('campfire-statechange'))
        })
      }}
    >
      {children}
    </button>
  )
}
