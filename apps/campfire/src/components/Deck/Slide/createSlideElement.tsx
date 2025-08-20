import { type ComponentChildren, type ComponentType, type JSX } from 'preact'
import { SlideLayer, type SlideLayerProps } from './SlideLayer'

interface CreateSlideElementOptions<P extends Record<string, any>> {
  /** Default tag or component to render. */
  as: keyof JSX.IntrinsicElements | ComponentType<any>
  /** Optional resolver for dynamic tag selection. */
  getAs?: (props: P) => keyof JSX.IntrinsicElements | ComponentType<any>
  /** data-testid applied to the layer wrapper. */
  testId: string
  /** Maps component props to element attributes. */
  mapElementProps?: (props: P) => Record<string, unknown>
  /** Builds the element class string. */
  mapClassName?: (props: P) => string | undefined
  /** Creates a style transform based on props. */
  mapStyleTransform?: (
    props: P
  ) => ((style: JSX.CSSProperties) => JSX.CSSProperties) | undefined
  /** Renders children from props. */
  renderChildren?: (props: P) => ComponentChildren
  /** Derives props passed to SlideLayer. */
  mapLayerProps?: (
    props: Omit<P, 'className' | 'style' | 'children'>
  ) => Omit<SlideLayerProps, 'children' | 'as' | 'elementProps'>
}

/**
 * Factory for slide components sharing SlideLayer configuration.
 *
 * @param options - Rendering configuration for the element.
 * @returns A component rendering within a SlideLayer.
 */
export const createSlideElement = <P extends Record<string, any>>(
  options: CreateSlideElementOptions<P>
) => {
  const Component = (props: P): JSX.Element => {
    const { className, style, children, ...rest } = props as any
    const elementProps = options.mapElementProps
      ? options.mapElementProps(props)
      : undefined
    const styleTransform = options.mapStyleTransform
      ? options.mapStyleTransform(props)
      : undefined
    const classes = options.mapClassName
      ? options.mapClassName(props)
      : className
    const Tag = options.getAs ? options.getAs(props) : options.as
    const childNodes = options.renderChildren
      ? options.renderChildren(props)
      : children
    const layerProps = options.mapLayerProps
      ? options.mapLayerProps(rest as P)
      : (rest as any)
    return (
      <SlideLayer
        as={Tag}
        elementProps={elementProps}
        className={classes}
        style={style}
        styleTransform={styleTransform}
        testId={options.testId}
        {...layerProps}
      >
        {childNodes}
      </SlideLayer>
    )
  }
  return Component
}

export default createSlideElement
