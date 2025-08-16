import type { Meta, StoryObj } from '@storybook/preact'
import { h } from 'preact'
import { Deck, Slide, Text, Appear } from '@campfire/components'

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
        <Text as='h2' x={80} y={80} size={36} color='var(--color-gray-50)'>
          First
        </Text>
      </Appear>
      <Appear at={1}>
        <Text x={500} y={400} size={24} color='var(--color-gray-50)'>
          Second
        </Text>
      </Appear>
    </Slide>
    <Slide>
      <Text as='h2' x={80} y={80} size={36} color='var(--color-gray-50)'>
        Next Slide
      </Text>
    </Slide>
  </Deck>
)

export const Basic: StoryObj<typeof Appear> = { render }
