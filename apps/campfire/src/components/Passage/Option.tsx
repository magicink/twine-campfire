import type { JSX } from 'preact'
import { mergeClasses } from '@campfire/utils/core'

export interface OptionProps
  extends Omit<JSX.HTMLAttributes<HTMLButtonElement>, 'className'> {
  /** Value represented by this option. */
  value: string
  /** Additional CSS classes for the option element. */
  className?: string | string[]
  /** Callback fired when this option is selected. */
  onSelectOption?: (value: string) => void
  /** Whether this option is currently selected. */
  selected?: boolean
}

/**
 * Generate a deterministic, valid HTML id for an option value.
 *
 * @param value - Raw option value.
 * @returns Sanitized id string.
 */
export const getOptionId = (value: string) => {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `option-${slug}`
}

/**
 * Option element used within a select directive.
 *
 * @param className - Optional additional classes.
 * @param style - Optional inline styles for the option element.
 * @param children - Display text for the option.
 * @param onSelectOption - Callback fired when this option is chosen.
 * @param rest - Additional option element attributes.
 * @returns The rendered option element.
 */
export const Option = ({
  className,
  style,
  children,
  onSelectOption,
  value,
  selected,
  ...rest
}: OptionProps) => {
  const mergedStyle =
    typeof style === 'string'
      ? `color:oklch(0 0 0);background:oklch(0.98 0 0);${style}`
      : {
          color: 'oklch(0 0 0)',
          background: 'oklch(0.98 0 0)',
          ...(style ?? {})
        }
  const id = getOptionId(value)
  return (
    <button
      type='button'
      data-testid='option'
      role='option'
      id={id}
      aria-selected={selected}
      className={mergeClasses(
        'campfire-option',
        'w-full text-left px-2 py-2 transition-colors hover:bg-[oklch(0.9_0_0)]',
        className
      )}
      style={mergedStyle}
      onClick={() => onSelectOption?.(value)}
      {...rest}
    >
      {children}
    </button>
  )
}

export default Option
