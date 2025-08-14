import type { Meta, StoryObj } from '@storybook/preact'
import { Deck } from '@campfire/components/Deck/Deck'
import { Slide } from '@campfire/components/Slide/Slide'
import { Appear } from '@campfire/components/Appear/Appear'
import { Text } from '@campfire/components/Text/Text'
import { Layer } from '@campfire/components/Layer/Layer'

const meta: Meta<typeof Deck> = {
  title: 'Deck/Sample',
  component: Deck
}

export default meta

type Story = StoryObj<typeof Deck>

/**
 * Renders a sample deck with two slides and multiple entrance and exit transitions.
 *
 * @returns The sample deck story.
 */
const renderSampleDeck = () => (
  <Deck>
    <Slide transition={{ enter: { type: 'fade' }, exit: { type: 'fade' } }}>
      <Layer x={100} y={100}>
        <Text content='Welcome to Slide 1' />
      </Layer>
      <Appear
        at={1}
        exitAt={3}
        enter={{ type: 'slide', dir: 'up' }}
        exit={{ type: 'fade' }}
      >
        <Layer x={100} y={200}>
          <Text content='This text appears and fades out.' />
        </Layer>
      </Appear>
      <Appear
        at={2}
        exitAt={4}
        enter={{ type: 'zoom' }}
        exit={{ type: 'slide', dir: 'left' }}
      >
        <Layer x={100} y={300}>
          <Text content='Another element with zoom and slide.' />
        </Layer>
      </Appear>
    </Slide>
    <Slide
      transition={{
        enter: { type: 'slide', dir: 'left' },
        exit: { type: 'slide', dir: 'right' }
      }}
    >
      <Layer x={100} y={100}>
        <Text content='Slide 2 Headline' />
      </Layer>
      <Appear at={1} enter={{ type: 'fade' }}>
        <Layer x={100} y={200}>
          <Text content='First item on slide 2.' />
        </Layer>
      </Appear>
      <Appear at={2} enter={{ type: 'slide', dir: 'down' }}>
        <Layer x={100} y={300}>
          <Text content='Second item slides in.' />
        </Layer>
      </Appear>
    </Slide>
  </Deck>
)

export const SampleDeck: Story = {
  render: renderSampleDeck
}
