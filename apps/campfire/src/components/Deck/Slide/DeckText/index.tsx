import { type ComponentChildren, type JSX } from 'preact'
import { Layer, type LayerProps } from '@campfire/components/Deck/Slide'

export interface DeckTextProps extends Omit<LayerProps, 'children'> {
  /** The HTML tag to render. Defaults to 'p'. */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'li' | 'span'
  /** Horizontal alignment. Defaults to 'left'. */
  align?: 'left' | 'center' | 'right' | 'justify'
  /** Font size in pixels. Falls back to theme variables or Tailwind utilities if omitted. */
  size?: number
  /** Font weight (100–900). Falls back to theme variables. */
  weight?: number
  /** Line height multiplier. */
  lineHeight?: number
  /** Text color. Use Tailwind classes or inline CSS variables (e.g., 'var(--accent)'). */
  color?: string
  /** Additional CSS class names for the text element. */
  className?: string
  /** Additional CSS properties for the text element. */
  style?: JSX.CSSProperties | string
  /** Text or rich node children to render inside the element. */
  children?: ComponentChildren
}

/**
 * Renders typographic content within an absolutely positioned layer.
 *
 * @param props - Configuration options for the text element.
 * @returns The rendered text element.
 */
export const DeckText = ({
  as = 'p',
  align,
  size,
  weight,
  lineHeight,
  color,
  className,
  style: styleProp,
  children,
  ...layerProps
}: DeckTextProps): JSX.Element => {
  const Tag = as
  const baseStyle: JSX.CSSProperties =
    typeof styleProp === 'string'
      ? Object.fromEntries(
          styleProp
            .split(';')
            .filter(Boolean)
            .map((rule: string) => {
              const [prop, ...rest] = rule.split(':')
              const name = prop
                .trim()
                .replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase())
              return [name, rest.join(':').trim()]
            })
        )
      : { ...styleProp }
  const style: JSX.CSSProperties = {
    ...baseStyle,
    fontSize: size !== undefined ? `${size}px` : baseStyle.fontSize,
    fontWeight: weight !== undefined ? String(weight) : baseStyle.fontWeight,
    lineHeight: lineHeight ? String(lineHeight) : baseStyle.lineHeight,
    color: color ?? baseStyle.color,
    textAlign: align ?? baseStyle.textAlign
  }
  const classes = ['text-base', 'font-normal']
  if (className) classes.unshift(className)
  return (
    <Layer data-testid='deckText' {...layerProps}>
      <Tag style={style} className={classes.join(' ')}>
        {children}
      </Tag>
    </Layer>
  )
}
