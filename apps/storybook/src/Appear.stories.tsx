import type { Meta, StoryObj } from '@storybook/preact'
import { h } from 'preact'
import { Deck, Slide, DeckText, Appear } from '@campfire/components'

const meta: Meta<typeof Appear> = {
  component: Appear,
  title: 'Campfire/Appear'
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
    <Slide background='bg-gray-100 dark:bg-gray-900'>
      <Appear at={0}>
        <DeckText
          as='h2'
          x={180}
          y={180}
          size={36}
          className={
            'text-[var(--color-gray-50) dark:text-[var(--color-gray-500)]'
          }
        >
          First
        </DeckText>
      </Appear>
      <Appear at={1}>
        <DeckText
          x={280}
          y={280}
          size={24}
          className={
            'text-[var(--color-gray-50) dark:text-[var(--color-gray-500)]'
          }
        >
          Second
        </DeckText>
      </Appear>
    </Slide>
    <Slide background='bg-gray-100 dark:bg-gray-900'>
      <DeckText
        as='h2'
        x={280}
        y={280}
        size={36}
        className={
          'text-[var(--color-gray-50) dark:text-[var(--color-gray-500)]'
        }
      >
        Next Slide
      </DeckText>
    </Slide>
  </Deck>
)

export const Basic: StoryObj<typeof Appear> = { render }
