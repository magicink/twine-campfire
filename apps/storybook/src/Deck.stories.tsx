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
 * component to progressively reveal content.
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
        <Text as={'h2'}>
          <h2 className='text-4xl text-[var(--color-gray-50)]'>Fade Slide</h2>
        </Text>
      </Appear>
      <Appear at={1}>
        <Text as={'p'}>
          <p className='text-2xl text-[var(--color-gray-50)]'>Second step</p>
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
        <Text as={'h2'}>
          <h2 class='text-4xl text-[var(--color-gray-50)]'>Slide Transition</h2>
        </Text>
      </Appear>
      <Appear at={1}>
        <Text as={'p'}>
          <p class='text-2xl text-[var(--color-gray-50)]'>Second step</p>
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
        <Text as={'h2'}>
          <h2 class='text-4xl text-[var(--color-gray-50)]'>Zoom Slide</h2>
        </Text>
      </Appear>
      <Appear at={1}>
        <Text as={'p'}>
          <p class='text-2xl text-[var(--color-gray-50)]'>Second step</p>
        </Text>
      </Appear>
    </Slide>
  </Deck>
)

export const WithTransitions: StoryObj<typeof Deck> = { render }
