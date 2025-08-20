import { type ComponentChildren, type JSX } from 'preact'
import { SlideLayer, type SlideLayerProps } from '../SlideLayer'

export interface SlideTextProps
  extends Omit<SlideLayerProps, 'children' | 'as'> {
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
export const SlideText = ({
  as = 'p',
  align,
  size,
  weight,
  lineHeight,
  color,
  className,
  style,
  children,
  ...layerProps
}: SlideTextProps): JSX.Element => {
  const styleTransform = (base: JSX.CSSProperties): JSX.CSSProperties => ({
    ...base,
    fontSize: size !== undefined ? `${size}px` : base.fontSize,
    fontWeight: weight !== undefined ? String(weight) : base.fontWeight,
    lineHeight: lineHeight ? String(lineHeight) : base.lineHeight,
    color: color ?? base.color,
    textAlign: align ?? base.textAlign
  })
  const classes = ['text-base', 'font-normal']
  if (className) classes.unshift(className)
  return (
    <SlideLayer
      as={as}
      style={style}
      styleTransform={styleTransform}
      className={classes.join(' ')}
      testId='slideText'
      {...layerProps}
    >
      {children}
    </SlideLayer>
  )
}

export default SlideText
