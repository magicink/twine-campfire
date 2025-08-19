import { type JSX } from 'preact'
import { Layer, type LayerProps } from '../Layer'
import parseInlineStyle from '@campfire/utils/parseInlineStyle'

export interface SlideImageProps extends Omit<LayerProps, 'children'> {
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
  style: styleProp,
  ...layerProps
}: SlideImageProps): JSX.Element => {
  const style: JSX.CSSProperties = parseInlineStyle(styleProp ?? {})

  return (
    <Layer data-testid='slideImage' {...layerProps}>
      <img src={src} alt={alt} className={className} style={style} />
    </Layer>
  )
}

export default SlideImage
