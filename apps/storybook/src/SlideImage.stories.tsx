import type { Meta, StoryObj } from '@storybook/preact'
import { Deck, Slide, SlideImage, SlideReveal } from '@campfire/components'

const meta: Meta<typeof SlideImage> = {
  component: SlideImage,
  title: 'Campfire/Components/SlideImage'
}

export default meta

/**
 * Renders an image positioned on a slide using the SlideImage component.
 *
 * @returns The rendered Deck containing a single slide with an image.
 */
export const Basic: StoryObj<typeof SlideImage> = {
  render: () => (
    <Deck className='w-[800px] h-[600px]'>
      <Slide>
        <SlideReveal
          at={0}
          enter={{ type: 'fade', duration: 300 }}
          exit={{ type: 'fade', duration: 300 }}
        >
          <SlideImage
            id='kitten-img'
            layerId='kitten-layer'
            className={'rounded-full'}
            src='https://placecats.com/neo/200/200'
            alt='Kitten'
            x={200}
            y={200}
          />
        </SlideReveal>
        <SlideReveal
          at={1}
          enter={{ type: 'zoom', dir: 'up', duration: 300 }}
          exit={{ type: 'zoom', dir: 'down', duration: 300 }}
        >
          <SlideImage
            className={'rounded'}
            src='https://placecats.com/bella/340/340'
            alt='Kitten'
            x={500}
            y={300}
          />
        </SlideReveal>
      </Slide>
    </Deck>
  )
}
