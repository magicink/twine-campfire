import { type JSX } from 'preact'
import { SlideLayer, type SlideLayerProps } from '../SlideLayer'

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
export const SlideImage = ({
  src,
  alt,
  className,
  style,
  ...layerProps
}: SlideImageProps): JSX.Element => (
  <SlideLayer
    as='img'
    elementProps={{ src, alt }}
    className={className}
    style={style}
    testId='slideImage'
    {...layerProps}
  />
)

export default SlideImage
