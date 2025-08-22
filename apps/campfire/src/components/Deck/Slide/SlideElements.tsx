import { type ComponentChildren, type JSX } from 'preact'
import { createSlideElement } from './createSlideElement'
import { type SlideLayerProps } from './SlideLayer'
import { type LayerProps } from './Layer'
import { parseInlineStyle } from '@campfire/utils/core'

export interface SlideImageProps
  extends Omit<SlideLayerProps, 'children' | 'as' | 'elementProps'> {
  /** Image source URL. */
  src: string
  /** Alternate text description for the image. */
  alt?: string
  /** Additional CSS class names for the image element. */
  className?: string
  /** Additional CSS properties for the image element. */
  style?: JSX.CSSProperties | string
}

/**
 * Renders an image within an absolutely positioned layer.
 *
 * @param props - Configuration options for the image element.
 * @returns The rendered image layer.
 */
export const SlideImage = createSlideElement<SlideImageProps>({
  as: 'img',
  testId: 'slideImage',
  mapElementProps: ({ src, alt }) => ({ src, alt }),
  mapLayerProps: ({ src, alt, ...layerProps }) => layerProps
})

export interface SlideTextProps
  extends Pick<
    LayerProps,
    'x' | 'y' | 'w' | 'h' | 'z' | 'rotate' | 'scale' | 'anchor'
  > {
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
  /** data-testid for the text element. */
  testId?: string
  /** Text or rich node children to render inside the element. */
  children?: ComponentChildren
  /** Additional props forwarded to the text element. */
  [key: string]: unknown
}

/**
 * Renders typographic content absolutely positioned on a slide.
 *
 * @param props - Configuration options for the text element.
 * @returns The rendered text element.
 */
export const SlideText = ({
  as: Tag = 'p',
  align,
  size,
  weight,
  lineHeight,
  color,
  className,
  style,
  testId = 'slideText',
  x,
  y,
  w,
  h,
  z,
  rotate,
  scale,
  anchor = 'top-left',
  children,
  ...rest
}: SlideTextProps): JSX.Element => {
  const baseStyle = parseInlineStyle(style ?? {})
  const finalStyle: JSX.CSSProperties = { position: 'absolute', ...baseStyle }
  if (x !== undefined) finalStyle.left = `${x}px`
  if (y !== undefined) finalStyle.top = `${y}px`
  if (w !== undefined) finalStyle.width = `${w}px`
  if (h !== undefined) finalStyle.height = `${h}px`
  if (z !== undefined) finalStyle.zIndex = z
  const transforms: string[] = []
  if (baseStyle.transform) transforms.push(String(baseStyle.transform))
  if (rotate !== undefined) transforms.push(`rotate(${rotate}deg)`)
  if (scale !== undefined) transforms.push(`scale(${scale})`)
  if (transforms.length) finalStyle.transform = transforms.join(' ')
  if (anchor !== 'top-left') {
    const originMap: Record<string, string> = {
      'top-left': '0% 0%',
      top: '50% 0%',
      'top-right': '100% 0%',
      left: '0% 50%',
      center: '50% 50%',
      right: '100% 50%',
      'bottom-left': '0% 100%',
      bottom: '50% 100%',
      'bottom-right': '100% 100%'
    }
    finalStyle.transformOrigin = originMap[anchor]
  } else if (baseStyle.transformOrigin) {
    finalStyle.transformOrigin = baseStyle.transformOrigin
  }
  if (align) finalStyle.textAlign = align
  if (size !== undefined) finalStyle.fontSize = `${size}px`
  if (weight !== undefined) finalStyle.fontWeight = String(weight)
  if (lineHeight !== undefined) finalStyle.lineHeight = String(lineHeight)
  if (color) finalStyle.color = color
  const classes = ['text-base', 'font-normal']
  if (className) classes.unshift(className)
  return (
    <Tag
      data-testid={testId}
      className={classes.join(' ')}
      style={finalStyle}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export interface SlideShapeProps
  extends Omit<SlideLayerProps, 'children' | 'as' | 'elementProps'> {
  /** Shape type to render. */
  type: 'rect' | 'ellipse' | 'line' | 'polygon'
  /** SVG path points used for polygon shapes. */
  points?: string
  /** Starting x-coordinate for line shapes. */
  x1?: number
  /** Starting y-coordinate for line shapes. */
  y1?: number
  /** Ending x-coordinate for line shapes. */
  x2?: number
  /** Ending y-coordinate for line shapes. */
  y2?: number
  /** Stroke color of the shape. */
  stroke?: string
  /** Stroke width of the shape. Defaults to 1. */
  strokeWidth?: number
  /** Fill color of the shape. Defaults to 'none'. */
  fill?: string
  /** Corner radius for rectangles. */
  radius?: number
  /** Adds a drop shadow when true. */
  shadow?: boolean
  /** Additional CSS class names for the svg element. */
  className?: string
  /** Additional CSS properties for the svg element. */
  style?: JSX.CSSProperties | string
}

/**
 * Renders basic SVG shapes within an absolutely positioned layer.
 *
 * @param props - Configuration options for the shape element.
 * @returns The rendered shape layer.
 */
export const SlideShape = createSlideElement<SlideShapeProps>({
  as: 'svg',
  testId: 'slideShape',
  mapElementProps: () => ({ width: '100%', height: '100%' }),
  mapStyleTransform:
    ({ shadow }) =>
    (base: JSX.CSSProperties) => {
      if (shadow) {
        const drop = 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))'
        base.filter = base.filter ? `${base.filter} ${drop}` : drop
      }
      return base
    },
  renderChildren: ({
    type,
    points,
    x1,
    y1,
    x2,
    y2,
    stroke,
    strokeWidth = 1,
    fill = 'none',
    radius
  }) => {
    const shapeProps = { stroke, strokeWidth, fill }
    switch (type) {
      case 'rect':
        return (
          <rect
            width='100%'
            height='100%'
            rx={radius}
            ry={radius}
            {...shapeProps}
          />
        )
      case 'ellipse':
        return <ellipse cx='50%' cy='50%' rx='50%' ry='50%' {...shapeProps} />
      case 'line':
        return <line x1={x1} y1={y1} x2={x2} y2={y2} {...shapeProps} />
      case 'polygon':
        return <polygon points={points} {...shapeProps} />
      default:
        return null
    }
  },
  mapLayerProps: ({
    type,
    points,
    x1,
    y1,
    x2,
    y2,
    stroke,
    strokeWidth,
    fill,
    radius,
    shadow,
    ...layerProps
  }) => layerProps
})
