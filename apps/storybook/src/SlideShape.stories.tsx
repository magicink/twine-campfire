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
          className={'animate-bounce'}
          type='polygon'
          x={500}
          y={250}
          w={100}
          h={100}
          points='50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35'
          fill='var(--color-primary-200)'
          stroke='var(--color-destructive-700)'
          shadow
        />
        <SlideShape
          type='ellipse'
          x={620}
          y={240}
          w={100}
          h={100}
          fill='var(--color-primary-300)'
          stroke='var(--color-primary-100)'
        />
        <SlideShape
          className={'animate-pulse'}
          type='polygon'
          x={330}
          y={230}
          w={120}
          h={120}
          points='0,120 60,0 120,120'
          fill='var(--color-destructive-200)'
          stroke='var(--color-destructive-700)'
        />
        <SlideShape
          type='rect'
          x={500}
          y={360}
          w={150}
          h={100}
          fill='var(--color-primary-300)'
          stroke='var(--color-primary-100)'
          radius={8}
          shadow
        />
        <SlideShape
          className={'rotate-45'}
          type='line'
          x={80}
          y={480}
          w={200}
          h={50}
          x1={0}
          y1={25}
          x2={200}
          y2={25}
          stroke='var(--color-gray-950)'
          strokeWidth={10}
        />
      </Slide>
    </Deck>
  )
}
