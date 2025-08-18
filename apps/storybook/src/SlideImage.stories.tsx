import type { Meta, StoryObj } from '@storybook/preact'
import { h } from 'preact'
import { Deck, Slide, SlideImage } from '@campfire/components'

const meta: Meta<typeof SlideImage> = {
  component: SlideImage,
  title: 'Campfire/SlideImage'
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
        <SlideImage
          src='https://placecat.com/neo/200/200'
          alt='Kitten'
          x={100}
          y={100}
        />
      </Slide>
    </Deck>
  )
}
