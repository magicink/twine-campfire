import { unified } from 'unified'
import remarkCampfire, {
  remarkCampfireIndentation
} from '@/packages/remark-campfire'
import type { RootContent, Root } from 'mdast'
import rfdc from 'rfdc'
import { useDirectiveHandlers } from '@campfire/hooks/useDirectiveHandlers'

const clone = rfdc()

interface TriggerButtonProps {
  className?: string | string[]
  content: string
  children?: string
  disabled?: boolean
}

/**
 * Button that processes directive content when clicked.
 *
 * @param className - Optional CSS classes.
 * @param content - Serialized directive block.
 * @param children - Button label.
 * @param disabled - Disables the button when true.
 */
export const TriggerButton = ({
  className,
  content,
  children,
  disabled
}: TriggerButtonProps) => {
  const handlers = useDirectiveHandlers()
  /**
   * Processes a block of AST nodes using the Campfire remark plugins.
   *
   * @param nodes - Nodes to process.
   */
  const runBlock = (nodes: RootContent[]) => {
    const root: Root = { type: 'root', children: nodes }
    unified()
      .use(remarkCampfireIndentation)
      .use(remarkCampfire, { handlers })
      .runSync(root)
  }
  const classes = Array.isArray(className)
    ? className
    : className
      ? [className]
      : []
  return (
    <button
      type='button'
      className={['campfire-trigger', 'font-libertinus', ...classes].join(' ')}
      disabled={disabled}
      onClick={() => runBlock(clone(JSON.parse(content)))}
    >
      {children}
    </button>
  )
}
