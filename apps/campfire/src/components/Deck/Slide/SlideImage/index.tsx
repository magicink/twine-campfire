import { type JSX } from 'preact'
import { createSlideElement } from '../createSlideElement'
import { type SlideLayerProps } from '../SlideLayer'

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

export default SlideImage
