import type { Meta, StoryObj } from '@storybook/preact'
import { h } from 'preact'
import { Deck, Slide, Text, Appear } from '@campfire/components'

const meta: Meta<typeof Deck> = {
  component: Deck,
  title: 'Campfire/Deck'
}

export default meta

/**
 * Renders the Deck story with three slides and transitions using the Appear
 * component to progressively reveal content. The first slide demonstrates
 * three sequential Appear elements to showcase entrance and exit animations.
 * Text layers are positioned so they do not overlap.
 *
 * @returns The rendered Deck element.
 */
const render: StoryObj<typeof Deck>['render'] = () => (
  <Deck className='w-[800px] h-[600px]'>
    <Slide
      transition={{
        enter: { type: 'fade', duration: 300 },
        exit: { type: 'fade', duration: 300 }
      }}
    >
      <Appear at={0}>
        <Text as='h2' x={80} y={80} size={36} color='var(--color-gray-50)'>
          Fade Slide
        </Text>
      </Appear>
      <Appear at={1}>
        <Text x={500} y={400} size={24} color='var(--color-gray-50)'>
          Second step
        </Text>
      </Appear>
      <Appear at={2}>
        <Text x={500} y={500} size={24} color='var(--color-gray-50)'>
          Third step
        </Text>
      </Appear>
    </Slide>
    <Slide
      transition={{
        enter: { type: 'slide', dir: 'left', duration: 300 },
        exit: { type: 'slide', dir: 'right', duration: 300 }
      }}
    >
      <Appear at={0}>
        <Text as='h2' x={80} y={80} size={36} color='var(--color-gray-50)'>
          Slide Transition
        </Text>
      </Appear>
      <Appear at={1}>
        <Text x={500} y={400} size={24} color='var(--color-gray-50)'>
          Second step
        </Text>
      </Appear>
    </Slide>
    <Slide
      transition={{
        enter: { type: 'zoom', duration: 300 },
        exit: { type: 'zoom', duration: 300 }
      }}
    >
      <Appear at={0}>
        <Text as='h2' x={80} y={80} size={36} color='var(--color-gray-50)'>
          Zoom Slide
        </Text>
      </Appear>
      <Appear at={1}>
        <Text x={500} y={400} size={24} color='var(--color-gray-50)'>
          Second step
        </Text>
      </Appear>
    </Slide>
  </Deck>
)

export const WithTransitions: StoryObj<typeof Deck> = { render }
