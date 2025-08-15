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
 * component to progressively reveal content. Text layers are positioned so
 * they do not overlap.
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
        <Text
          as='h2'
          x={80}
          y={80}
          size={36}
          color='var(--color-gray-50)'
          content='Fade Slide'
        />
      </Appear>
      <Appear at={1}>
        <Text
          x={500}
          y={400}
          size={24}
          color='var(--color-gray-50)'
          content='Second step'
        />
      </Appear>
    </Slide>
    <Slide
      transition={{
        enter: { type: 'slide', dir: 'left', duration: 300 },
        exit: { type: 'slide', dir: 'right', duration: 300 }
      }}
    >
      <Appear at={0}>
        <Text
          as='h2'
          x={80}
          y={80}
          size={36}
          color='var(--color-gray-50)'
          content='Slide Transition'
        />
      </Appear>
      <Appear at={1}>
        <Text
          x={500}
          y={400}
          size={24}
          color='var(--color-gray-50)'
          content='Second step'
        />
      </Appear>
    </Slide>
    <Slide
      transition={{
        enter: { type: 'zoom', duration: 300 },
        exit: { type: 'zoom', duration: 300 }
      }}
    >
      <Appear at={0}>
        <Text
          as='h2'
          x={80}
          y={80}
          size={36}
          color='var(--color-gray-50)'
          content='Zoom Slide'
        />
      </Appear>
      <Appear at={1}>
        <Text
          x={500}
          y={400}
          size={24}
          color='var(--color-gray-50)'
          content='Second step'
        />
      </Appear>
    </Slide>
  </Deck>
)

export const WithTransitions: StoryObj<typeof Deck> = { render }
