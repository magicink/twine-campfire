import type { Meta, StoryObj } from '@storybook/preact'
import { h } from 'preact'
import { Deck, Slide, SlideShape } from '@campfire/components'

const meta: Meta<typeof SlideShape> = {
  component: SlideShape,
  title: 'Campfire/SlideShape'
}

export default meta

/**
 * Demonstrates drawing basic shapes on a slide using SlideShape.
 *
 * @returns Deck with several shapes.
 */
export const Basic: StoryObj<typeof SlideShape> = {
  render: () => (
    <Deck className='w-[800px] h-[600px]'>
      <Slide>
        <SlideShape
          type='rect'
          x={50}
          y={50}
          w={150}
          h={100}
          fill='#93c5fd'
          stroke='#1e3a8a'
          radius={8}
          shadow
        />
        <SlideShape
          type='line'
          x={300}
          y={100}
          w={200}
          h={50}
          x1={0}
          y1={25}
          x2={200}
          y2={25}
          stroke='#000'
        />
      </Slide>
    </Deck>
  )
}
