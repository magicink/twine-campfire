import type { JSX } from 'preact'

export interface OptionProps
  extends Omit<JSX.HTMLAttributes<HTMLButtonElement>, 'className'> {
  /** Value represented by this option. */
  value: string
  /** Additional CSS classes for the option element. */
  className?: string | string[]
  /** Callback fired when this option is selected. */
  onSelectOption?: (value: string) => void
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
  ...rest
}: OptionProps) => {
  const classes = Array.isArray(className)
    ? className
    : className
      ? [className]
      : []
  const mergedStyle =
    typeof style === 'string'
      ? `color:oklch(0 0 0);background:oklch(0.98 0 0);${style}`
      : {
          color: 'oklch(0 0 0)',
          background: 'oklch(0.98 0 0)',
          ...(style ?? {})
        }
  return (
    <button
      type='button'
      data-testid='option'
      className={[
        'campfire-option',
        'w-full text-left px-3 py-2 transition-colors hover:bg-[oklch(0.9_0_0)]',
        ...classes
      ].join(' ')}
      style={mergedStyle}
      onClick={() => onSelectOption?.(value)}
      {...rest}
    >
      {children}
    </button>
  )
}

export default Option
