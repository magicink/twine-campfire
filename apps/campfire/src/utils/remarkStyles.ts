import { visit } from 'unist-util-visit'
import type { Root as MdRoot, Paragraph } from 'mdast'
import type { Root as HastRoot } from 'hast'
import type { Data } from 'unist'
import type { Properties } from 'hast'

export const checkboxStyles =
  'peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50'

export const checkboxIndicatorStyles =
  'flex items-center justify-center text-current transition-none pointer-events-none'

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

/**
 * Applies default Tailwind font family and size classes to Markdown paragraph nodes.
 *
 * @returns Transformer attaching class names to paragraph elements.
 */
interface NodeData extends Data {
  hName?: string
  hProperties?: Properties
}

export const remarkParagraphStyles = () => (tree: MdRoot) => {
  visit(tree, 'paragraph', (node: Paragraph) => {
    const data = (node.data ?? (node.data = {})) as NodeData
    if (data.hName) return
    appendClassNames(node, ['font-libertinus', 'text-base'])
  })
}

/**
 * Applies default Tailwind font family, size, and weight classes to Markdown heading nodes.
 *
 * @returns Transformer attaching class names to heading elements.
 */
export const remarkHeadingStyles = () => (tree: MdRoot) => {
  visit(tree, 'heading', node => {
    const mapping: Record<number, string> = {
      1: 'font-libertinus text-4xl font-bold',
      2: 'font-libertinus text-3xl font-semibold',
      3: 'font-libertinus text-2xl font-medium',
      4: 'font-libertinus text-xl font-normal',
      5: 'font-libertinus text-lg font-normal',
      6: 'font-libertinus text-base font-light'
    }
    const cls = mapping[node.depth]
    if (!cls) return
    appendClassNames(node, cls.split(' '))
  })
}

/**
 * Appends class names to a HAST element's `className` property, preserving any
 * existing classes.
 *
 * @param props - Element properties object.
 * @param classNames - Classes to append.
 */
const appendElementClassNames = (
  props: Record<string, unknown>,
  classNames: string[]
): void => {
  const existing = props.className
  const classes = Array.isArray(existing)
    ? existing.filter((c): c is string => typeof c === 'string')
    : typeof existing === 'string'
      ? [existing]
      : []
  classes.push(...classNames)
  props.className = classes
}

/**
 * Applies Tailwind utility classes to GitHub Flavored Markdown table elements.
 *
 * @returns Rehype transformer attaching classes to table-related elements.
 */
export const rehypeTableStyles =
  () =>
  (tree: HastRoot): void => {
    visit(tree, 'element', node => {
      const props = (node.properties ??= {}) as Record<string, unknown>
      switch (node.tagName) {
        case 'table':
          appendElementClassNames(props, [
            'w-full',
            'caption-bottom',
            'text-sm'
          ])
          break
        case 'thead':
          appendElementClassNames(props, ['[&_tr]:border-b'])
          break
        case 'tr':
          appendElementClassNames(props, [
            'hover:bg-muted/50',
            'data-[state=selected]:bg-muted',
            'border-b',
            'transition-colors'
          ])
          break
        case 'th':
          appendElementClassNames(props, [
            'text-foreground',
            'h-10',
            'px-2',
            'text-left',
            'align-middle',
            'font-medium',
            'whitespace-nowrap',
            '[&:has([role=checkbox])]:pr-0',
            '[&>[role=checkbox]]:translate-y-[2px]',
            'w-[100px]'
          ])
          break
        case 'tbody':
          appendElementClassNames(props, ['[&_tr:last-child]:border-0'])
          break
        case 'td':
          appendElementClassNames(props, [
            'p-2',
            'align-middle',
            'whitespace-nowrap',
            '[&:has([role=checkbox])]:pr-0',
            '[&>[role=checkbox]]:translate-y-[2px]',
            'font-medium'
          ])
          break
        case 'caption':
          appendElementClassNames(props, [
            'text-muted-foreground',
            'mt-4',
            'text-sm'
          ])
          break
      }
    })
  }

/**
 * Replaces `<input type="checkbox">` elements produced by Markdown checklists
 * with styled button elements and applies flex column layout and spacing to the
 * task list container. The buttons are disabled so the user cannot interact
 * with static checklist items.
 *
 * @returns Rehype transformer converting checklist inputs to buttons and styling lists.
 */
export const rehypeChecklistButtons =
  () =>
  (tree: HastRoot): void => {
    visit(
      tree,
      'element',
      (node: any, index: number | undefined, parent: any) => {
        if (node.tagName === 'ul') {
          const props = (node.properties ??= {}) as Record<string, unknown>
          const className = props.className
          const classes = Array.isArray(className)
            ? className
            : typeof className === 'string'
              ? [className]
              : []
          if (classes.includes('contains-task-list')) {
            appendElementClassNames(props, [
              'flex',
              'flex-col',
              'gap-[var(--size-xs)]'
            ])
          }
        }
        if (
          node.tagName === 'input' &&
          (node.properties as any)?.type === 'checkbox' &&
          parent &&
          typeof index === 'number'
        ) {
          const checked = Boolean((node.properties as any).checked)
          const button = {
            type: 'element',
            tagName: 'button',
            properties: {
              type: 'button',
              role: 'checkbox',
              disabled: true,
              'aria-checked': checked ? 'true' : 'false',
              'data-state': checked ? 'checked' : 'unchecked',
              'data-testid': 'checkbox',
              className: ['campfire-checkbox', checkboxStyles]
            },
            children: [
              {
                type: 'element',
                tagName: 'span',
                properties: {
                  'data-state': checked ? 'checked' : 'unchecked',
                  'data-slot': 'checkbox-indicator',
                  className: checkboxIndicatorStyles,
                  style: 'pointer-events:none'
                },
                children: checked
                  ? [
                      {
                        type: 'element',
                        tagName: 'svg',
                        properties: {
                          xmlns: 'http://www.w3.org/2000/svg',
                          width: 24,
                          height: 24,
                          viewBox: '0 0 24 24',
                          fill: 'none',
                          stroke: 'currentColor',
                          'stroke-width': 2,
                          'stroke-linecap': 'round',
                          'stroke-linejoin': 'round',
                          className: 'lucide lucide-check size-3.5'
                        },
                        children: [
                          {
                            type: 'element',
                            tagName: 'path',
                            properties: { d: 'M20 6 9 17l-5-5' },
                            children: []
                          }
                        ]
                      }
                    ]
                  : []
              }
            ]
          }

          parent.children.splice(index, 1, button)

          const parentProps = (parent.properties ??= {}) as Record<
            string,
            unknown
          >
          appendElementClassNames(parentProps, [
            'flex',
            'items-center',
            'gap-[var(--size-xs)]'
          ])

          const rest = parent.children.splice(index + 1)
          if (
            rest.length &&
            rest[0].type === 'text' &&
            typeof (rest[0] as any).value === 'string' &&
            !(rest[0] as any).value.trim()
          ) {
            rest.shift()
          }
          if (rest.length) {
            parent.children.splice(index + 1, 0, {
              type: 'element',
              tagName: 'span',
              properties: {
                className: ['peer-data-[state=checked]:line-through']
              },
              children: rest
            })
          }
        }
      }
    )
  }
