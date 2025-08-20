import type { Meta, StoryObj } from '@storybook/preact'
import { h } from 'preact'
import { Deck, Slide, SlideText, Appear } from '@campfire/components'

const meta: Meta<typeof Appear> = {
  component: Appear,
  title: 'Campfire/Components/Deck/Slide/Appear'
}

export default meta

/**
 * Renders a deck demonstrating sequential Appear elements and their
 * behavior when switching slides.
 *
 * @returns The rendered deck.
 */
const render: StoryObj<typeof Appear>['render'] = () => (
  <Deck className='w-[800px] h-[600px]'>
    <Slide
      transition={{ type: 'slide' }}
      className='bg-gray-100 dark:bg-gray-900'
    >
      <Appear at={0}>
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
      </Appear>
      <Appear at={1}>
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
      </Appear>
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

export const Basic: StoryObj<typeof Appear> = { render }
