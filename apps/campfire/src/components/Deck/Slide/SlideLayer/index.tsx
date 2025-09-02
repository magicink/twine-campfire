import { type ComponentChildren, type ComponentType, type JSX } from 'preact'
import { Layer, type LayerProps } from '../Layer'
import { mergeClasses, parseInlineStyle } from '@campfire/utils/core'

export interface SlideLayerProps
  extends Omit<LayerProps, 'children' | 'className'> {
  /** Class applied to the Layer wrapper. */
  layerClassName?: string
  /** id applied to the Layer wrapper. */
  layerId?: string
  /** Element or component to render inside the Layer. */
  as?: keyof JSX.IntrinsicElements | ComponentType<any>
  /** id applied to the inner element. */
  id?: string
  /** Class applied to the inner element. */
  className?: string
  /** Style for the inner element. */
  style?: JSX.CSSProperties | string
  /** Transform function for the parsed style. */
  styleTransform?: (style: JSX.CSSProperties) => JSX.CSSProperties
  /** data-testid for the Layer wrapper. */
  testId?: string
  /** Props forwarded to the inner element. */
  elementProps?: Record<string, unknown>
  /** Child nodes to render within the inner element. */
  children?: ComponentChildren
}

/**
 * Wraps slide content with a Layer and applies inline styles.
 *
 * @param props - Configuration for the layer and inner element.
 * @returns Positioned and styled slide content.
 */
export const SlideLayer = ({
  layerClassName,
  layerId,
  id,
  as: Tag = 'div',
  className,
  style,
  styleTransform,
  testId = 'slideLayer',
  elementProps = {},
  children,
  ...layerProps
}: SlideLayerProps): JSX.Element => {
  const baseStyle = parseInlineStyle(style ?? {})
  const finalStyle = styleTransform ? styleTransform(baseStyle) : baseStyle
  return (
    <Layer
      data-testid={testId}
      className={mergeClasses('campfire-slide-layer', layerClassName)}
      id={layerId}
      {...layerProps}
    >
      <Tag id={id} className={className} style={finalStyle} {...elementProps}>
        {children}
      </Tag>
    </Layer>
  )
}

export default SlideLayer
