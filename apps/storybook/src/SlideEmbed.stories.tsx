import type { Meta, StoryObj } from '@storybook/preact'
import { Deck, Slide, SlideEmbed, SlideReveal } from '@campfire/components'

const meta: Meta<typeof SlideEmbed> = {
  component: SlideEmbed,
  title: 'Campfire/Components/SlideEmbed'
}

export default meta

/**
 * Displays external content inside a slide using the SlideEmbed component.
 *
 * @returns A Deck containing a single embedded video.
 */
export const Basic: StoryObj<typeof SlideEmbed> = {
  render: () => (
    <Deck className='w-[800px] h-[600px]'>
      <Slide>
        <SlideReveal at={0}>
          <SlideEmbed
            src='https://www.youtube.com/embed/dQw4w9WgXcQ'
            w={560}
            h={315}
            x={120}
            y={100}
            allow='autoplay; encrypted-media'
            allowFullScreen
          />
        </SlideReveal>
      </Slide>
    </Deck>
  )
}
