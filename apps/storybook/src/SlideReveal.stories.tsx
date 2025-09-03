import type { Meta, StoryObj } from '@storybook/preact'
import { h } from 'preact'
import { Deck, Slide, SlideText, SlideReveal } from '@campfire/components'

const meta: Meta<typeof SlideReveal> = {
  component: SlideReveal,
  title: 'Campfire/Components/SlideReveal'
}

export default meta

/**
 * Renders a deck demonstrating sequential SlideReveal elements and their
 * behavior when switching slides.
 *
 * @returns The rendered deck.
 */
const render: StoryObj<typeof SlideReveal>['render'] = () => (
  <Deck className='w-[800px] h-[600px]'>
    <Slide
      transition={{ type: 'slide' }}
      className='bg-gray-100 dark:bg-gray-900'
    >
      <SlideReveal
        at={0}
        className='rounded'
        style={{ border: '2px solid oklch(0.85 0.1 200)' }}
        onEnter='[]'
      >
        <SlideText
          as='h2'
          x={180}
          y={180}
          size={36}
          className={
            'text-[var(--color-gray-50) dark:text-[var(--color-gray-500)]'
          }
        >
          First
        </SlideText>
      </SlideReveal>
      <SlideReveal at={1}>
        <SlideText
          x={280}
          y={280}
          size={24}
          className={
            'text-[var(--color-gray-50) dark:text-[var(--color-gray-500)]'
          }
        >
          Second
        </SlideText>
      </SlideReveal>
    </Slide>
    <Slide className='bg-gray-100 dark:bg-gray-900'>
      <SlideText
        as='h2'
        x={280}
        y={280}
        size={36}
        className={
          'text-[var(--color-gray-50) dark:text-[var(--color-gray-500)]'
        }
      >
        Next Slide
      </SlideText>
    </Slide>
  </Deck>
)

export const Basic: StoryObj<typeof SlideReveal> = { render }
