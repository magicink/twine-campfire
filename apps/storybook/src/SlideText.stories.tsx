import type { Meta, StoryObj } from '@storybook/preact'
import { h } from 'preact'
import { Deck, Slide, SlideText } from '@campfire/components'

const meta: Meta<typeof SlideText> = {
  component: SlideText,
  title: 'Campfire/SlideText'
}

export default meta

/**
 * Demonstrates text rendering on a slide using SlideText.
 *
 * @returns Deck with a single slide containing text.
 */
export const Basic: StoryObj<typeof SlideText> = {
  render: () => (
    <Deck className='w-[800px] h-[600px]'>
      <Slide>
        <SlideText x={100} y={100} size={32} color='white'>
          Hello Campfire
        </SlideText>
      </Slide>
    </Deck>
  )
}
