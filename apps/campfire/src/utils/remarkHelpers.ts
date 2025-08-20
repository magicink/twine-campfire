import type { Data } from 'unist'
import type { Properties } from 'hast'

/**
 * Appends one or more class names to a node's `hProperties.className`,
 * preserving any existing classes.
 *
 * @param node - Target MDAST node.
 * @param classNames - Class names to append.
 */
export const appendClassNames = (
  node: { data?: Data & { hProperties?: Properties } },
  classNames: string[]
): void => {
  const data = (node.data ?? (node.data = {})) as Data & {
    hProperties?: Properties
  }
  const props = (data.hProperties ?? (data.hProperties = {})) as Properties & {
    className?: string | string[]
  }
  const existing = props.className
  const classes = Array.isArray(existing)
    ? existing.filter((c): c is string => typeof c === 'string')
    : typeof existing === 'string'
      ? [existing]
      : []
  classes.push(...classNames)
  props.className = classes
}

export default appendClassNames
