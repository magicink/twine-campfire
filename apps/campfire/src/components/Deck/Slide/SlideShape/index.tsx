import { type JSX } from 'preact'
import { createSlideElement } from '../createSlideElement'
import { type SlideLayerProps } from '../SlideLayer'

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

export default SlideShape
