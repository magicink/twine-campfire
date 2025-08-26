import type { JSX } from 'preact'

interface OptionProps
  extends Omit<JSX.OptionHTMLAttributes<HTMLOptionElement>, 'className'> {
  /** Additional CSS classes for the option element. */
  className?: string | string[]
}

/**
 * Option element used within a select directive.
 *
 * @param className - Optional additional classes.
 * @param style - Optional inline styles for the option element.
 * @param children - Display text for the option.
 * @param rest - Additional option element attributes.
 * @returns The rendered option element.
 */
export const Option = ({
  className,
  style,
  children,
  ...rest
}: OptionProps) => {
  const classes = Array.isArray(className)
    ? className
    : className
      ? [className]
      : []
  const mergedStyle =
    typeof style === 'string'
      ? `color:#000;background:#fff;${style}`
      : { color: '#000', background: '#fff', ...(style ?? {}) }
  return (
    <option
      data-testid='option'
      className={['campfire-option', ...classes].join(' ')}
      style={mergedStyle}
      {...rest}
    >
      {children}
    </option>
  )
}

export default Option
