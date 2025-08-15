import { type ComponentChildren, type JSX } from 'preact'
import { Layer, type LayerProps } from '@campfire/components/Deck/Slide/Layer'

export interface TextProps extends Omit<LayerProps, 'children'> {
  /** The HTML tag to render. Defaults to 'p'. */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'li' | 'span'
  /** Plain-text content. If provided, children should be omitted. */
  content?: string
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
  /** Children (rich nodes) override the content prop. */
  children?: ComponentChildren
}

/**
 * Renders typographic content within an absolutely positioned layer.
 *
 * @param props - Configuration options for the text element.
 * @returns The rendered text element.
 */
export const Text = ({
  as = 'p',
  content,
  align = 'left',
  size,
  weight,
  lineHeight,
  color,
  children,
  ...layerProps
}: TextProps): JSX.Element => {
  const Tag = as
  const style: JSX.CSSProperties = {
    fontSize: size !== undefined ? `${size}px` : undefined,
    fontWeight: weight !== undefined ? String(weight) : undefined,
    lineHeight: lineHeight ? String(lineHeight) : undefined,
    color,
    textAlign: align
  }
  return (
    <Layer {...layerProps}>
      <Tag style={style} className='text-base font-normal'>
        {children ?? content}
      </Tag>
    </Layer>
  )
}
