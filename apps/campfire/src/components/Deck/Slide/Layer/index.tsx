import { type ComponentChildren, type JSX } from 'preact'

export interface LayerProps {
  x?: number
  y?: number
  w?: number
  h?: number
  z?: number
  rotate?: number
  scale?: number
  anchor?:
    | 'top-left'
    | 'top'
    | 'top-right'
    | 'left'
    | 'center'
    | 'right'
    | 'bottom-left'
    | 'bottom'
    | 'bottom-right'
  className?: string
  children?: ComponentChildren
  [key: string]: unknown
}

/**
 * Absolutely positioned wrapper for slide content.
 *
 * @param props - Positioning options and child elements.
 * @returns A positioned container element.
 */
export const Layer = ({
  x,
  y,
  w,
  h,
  z,
  rotate,
  scale,
  anchor = 'top-left',
  className,
  children,
  ...rest
}: LayerProps): JSX.Element => {
  const style: JSX.CSSProperties = {
    position: 'absolute',
    left: x !== undefined ? `${x}px` : undefined,
    top: y !== undefined ? `${y}px` : undefined,
    width: w !== undefined ? `${w}px` : undefined,
    height: h !== undefined ? `${h}px` : undefined,
    zIndex: z
  }
  const transforms: string[] = []
  if (rotate !== undefined) transforms.push(`rotate(${rotate}deg)`)
  if (scale !== undefined) transforms.push(`scale(${scale})`)
  if (transforms.length > 0) {
    style.transform = transforms.join(' ')
  }
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
    style.transformOrigin = originMap[anchor]
  }
  return (
    <div className={className} style={style} {...rest}>
      {children}
    </div>
  )
}
