import { type ComponentChildren, type JSX } from 'preact'
import { createSlideElement } from './createSlideElement'
import { type SlideLayerProps } from './SlideLayer'

/**
 * Props for the SlideImage element. Inherits `className` and `style` from
 * {@link SlideLayerProps}.
 */
export interface SlideImageProps
  extends Omit<SlideLayerProps, 'children' | 'as' | 'elementProps'> {
  /** Image source URL. */
  src: string
  /** Alternate text description for the image. */
  alt?: string
}

/**
 * Renders an image within an absolutely positioned layer.
 *
 * @param props - Configuration options for the image element, including
 * inherited `className` and `style` fields.
 * @returns The rendered image layer.
 */
export const SlideImage = createSlideElement<SlideImageProps>({
  as: 'img',
  testId: 'slideImage',
  mapClassName: ({ className }) =>
    ['campfire-slide-image', className]
      .filter(c => c != null && c !== '')
      .join(' '),
  mapElementProps: ({ src, alt }) => ({ src, alt }),
  mapLayerProps: ({ src, alt, ...layerProps }) => layerProps
})

/**
 * Props for the SlideEmbed element. Inherits `className` and `style` from
 * {@link SlideLayerProps}.
 */
export interface SlideEmbedProps
  extends Omit<SlideLayerProps, 'children' | 'as' | 'elementProps'> {
  /** Embed source URL. */
  src: string
  /** Permissions applied to the iframe's `allow` attribute. */
  allow?: string
  /** Referrer policy for the iframe. */
  referrerPolicy?: string
  /** Enables fullscreen mode when true. */
  allowFullScreen?: boolean
}

/**
 * Renders external content within an iframe positioned on a slide.
 *
 * @param props - Configuration options for the embed element, including
 * inherited `className` and `style` fields.
 * @returns The rendered embed layer.
 */
export const SlideEmbed = createSlideElement<SlideEmbedProps>({
  as: 'iframe',
  testId: 'slideEmbed',
  mapClassName: ({ className }) =>
    ['campfire-slide-embed', className]
      .filter(c => c != null && c !== '')
      .join(' '),
  mapElementProps: ({ src, allow, referrerPolicy, allowFullScreen }) => ({
    src,
    allow,
    referrerPolicy,
    allowFullScreen: allowFullScreen ? true : undefined
  }),
  mapLayerProps: ({
    src,
    allow,
    referrerPolicy,
    allowFullScreen,
    ...layerProps
  }) => layerProps
})

/**
 * Props for the SlideText element. Inherits `className` and `style` from
 * {@link SlideLayerProps}.
 */
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
  /** Text or rich node children to render inside the element. */
  children?: ComponentChildren
}

/**
 * Renders typographic content within an absolutely positioned layer.
 *
 * @param props - Configuration options for the text element, including
 * inherited `className` and `style` fields.
 * @returns The rendered text element.
 */
export const SlideText = createSlideElement<SlideTextProps>({
  as: 'p',
  getAs: ({ as = 'p' }) => as,
  testId: 'slideText',
  mapClassName: ({ className }) =>
    [className, 'campfire-slide-text', 'text-base', 'font-normal']
      .filter(c => c != null && c !== '')
      .join(' '),
  mapStyleTransform:
    ({ align, size, weight, lineHeight, color }) =>
    (base: JSX.CSSProperties): JSX.CSSProperties => ({
      ...base,
      fontSize: size !== undefined ? `${size}px` : base.fontSize,
      fontWeight: weight !== undefined ? String(weight) : base.fontWeight,
      lineHeight: lineHeight ? String(lineHeight) : base.lineHeight,
      color: color ?? base.color,
      textAlign: align ?? base.textAlign
    }),
  mapLayerProps: ({
    as: _as,
    align,
    size,
    weight,
    lineHeight,
    color,
    ...layerProps
  }) => layerProps
})

/**
 * Props for the SlideShape element. Inherits `className` and `style` from
 * {@link SlideLayerProps}.
 */
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
}

/**
 * Renders basic SVG shapes within an absolutely positioned layer.
 *
 * @param props - Configuration options for the shape element, including
 * inherited `className` and `style` fields.
 * @returns The rendered shape layer.
 */
export const SlideShape = createSlideElement<SlideShapeProps>({
  as: 'svg',
  testId: 'slideShape',
  mapClassName: ({ className }) =>
    ['campfire-slide-shape', className]
      .filter(c => c != null && c !== '')
      .join(' '),
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
