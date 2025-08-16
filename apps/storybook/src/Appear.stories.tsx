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
    <Slide>
      <Appear at={0}>
        <DeckText as='h2' x={80} y={80} size={36} color='var(--color-gray-50)'>
          First
        </DeckText>
      </Appear>
      <Appear at={1}>
        <DeckText x={500} y={400} size={24} color='var(--color-gray-50)'>
          Second
        </DeckText>
      </Appear>
    </Slide>
    <Slide>
      <DeckText as='h2' x={80} y={80} size={36} color='var(--color-gray-50)'>
        Next Slide
      </DeckText>
    </Slide>
  </Deck>
)

export const Basic: StoryObj<typeof Appear> = { render }
