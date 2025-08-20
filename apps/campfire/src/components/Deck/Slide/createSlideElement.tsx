import { type ComponentChildren, type ComponentType, type JSX } from 'preact'
import { SlideLayer, type SlideLayerProps } from './SlideLayer'

interface SlideElementBaseProps {
  className?: string
  style?: JSX.CSSProperties | string
  children?: ComponentChildren
}

type SlideElementLayerProps = Omit<
  SlideLayerProps,
  'children' | 'as' | 'elementProps' | 'className' | 'style'
>

interface CreateSlideElementOptions<P extends SlideElementBaseProps> {
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
    props: Omit<P, keyof SlideElementBaseProps>
  ) => SlideElementLayerProps
}

/**
 * Factory for slide components sharing SlideLayer configuration.
 *
 * @param options - Rendering configuration for the element.
 * @returns A component rendering within a SlideLayer.
 */
export const createSlideElement = <
  P extends SlideElementBaseProps &
    SlideElementLayerProps &
    Record<string, unknown>
>(
  options: CreateSlideElementOptions<P>
) => {
  const Component = (props: P): JSX.Element => {
    const { className, style, children, ...rest } = props
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
    const layerProps: SlideElementLayerProps = options.mapLayerProps
      ? options.mapLayerProps(rest)
      : rest
    return (
      <SlideLayer
        as={Tag}
        elementProps={elementProps}
        className={classes}
        style={style}
        {...layerProps}
        styleTransform={styleTransform}
        testId={options.testId}
      >
        {childNodes}
      </SlideLayer>
    )
  }
  return Component
}

export default createSlideElement
