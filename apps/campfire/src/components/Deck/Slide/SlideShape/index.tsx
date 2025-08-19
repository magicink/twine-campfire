import { type JSX } from 'preact'
import { Layer, type LayerProps } from '../Layer'
import parseInlineStyle from '@campfire/utils/parseInlineStyle'

export interface SlideShapeProps extends Omit<LayerProps, 'children'> {
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
export const SlideShape = ({
  type,
  points,
  x1,
  y1,
  x2,
  y2,
  stroke,
  strokeWidth = 1,
  fill = 'none',
  radius,
  shadow,
  className,
  style: styleProp,
  ...layerProps
}: SlideShapeProps): JSX.Element => {
  const style: JSX.CSSProperties = parseInlineStyle(styleProp ?? {})
  if (shadow) {
    const drop = 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))'
    style.filter = style.filter ? `${style.filter} ${drop}` : drop
  }
  const shapeProps = { stroke, strokeWidth, fill }
  let shape: JSX.Element | null = null
  switch (type) {
    case 'rect':
      shape = (
        <rect
          width='100%'
          height='100%'
          rx={radius}
          ry={radius}
          {...shapeProps}
        />
      )
      break
    case 'ellipse':
      shape = <ellipse cx='50%' cy='50%' rx='50%' ry='50%' {...shapeProps} />
      break
    case 'line':
      shape = <line x1={x1} y1={y1} x2={x2} y2={y2} {...shapeProps} />
      break
    case 'polygon':
      shape = <polygon points={points} {...shapeProps} />
      break
    default:
      shape = null
  }
  return (
    <Layer data-testid='slideShape' {...layerProps}>
      <svg width='100%' height='100%' className={className} style={style}>
        {shape}
      </svg>
    </Layer>
  )
}

export default SlideShape
