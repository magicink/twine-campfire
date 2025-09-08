import type { Meta, StoryObj } from '@storybook/preact'
import { Deck, Slide, SlideEmbed, SlideReveal } from '@campfire/components'

const meta: Meta<typeof SlideEmbed> = {
  component: SlideEmbed,
  title: 'Campfire/Components/SlideEmbed'
}

export default meta

/**
 * Displays an embedded video centered on the slide at full width using the
 * SlideEmbed component.
 *
 * @returns A Deck containing a single embedded video.
 */
export const Basic: StoryObj<typeof SlideEmbed> = {
  render: () => (
    <Deck className='w-[800px] h-[600px]' hideNavigation>
      <Slide>
        <SlideReveal at={0} className={'w-full h-full'}>
          <SlideEmbed
            layerClassName={'w-full h-full flex justify-center items-center'}
            className={'aspect-video'}
            src='https://www.youtube.com/embed/dQw4w9WgXcQ'
            allow='autoplay; encrypted-media'
            allowFullScreen
          />
        </SlideReveal>
      </Slide>
    </Deck>
  )
}
