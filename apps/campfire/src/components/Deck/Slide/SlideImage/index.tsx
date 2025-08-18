import { type JSX } from 'preact'
import { Layer, type LayerProps } from '@campfire/components/Deck/Slide'

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
  const style: JSX.CSSProperties =
    typeof styleProp === 'string'
      ? Object.fromEntries(
          styleProp
            .split(';')
            .filter(Boolean)
            .map((rule: string) => {
              const [prop, ...rest] = rule.split(':')
              const name = prop
                .trim()
                .replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase())
              return [name, rest.join(':').trim()]
            })
        )
      : { ...styleProp }

  return (
    <Layer data-testid='slideImage' {...layerProps}>
      <img src={src} alt={alt} className={className} style={style} />
    </Layer>
  )
}

export default SlideImage
