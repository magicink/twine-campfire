import type { Meta, StoryObj } from '@storybook/preact'
import { h } from 'preact'
import { Deck, Slide } from '@campfire/components'

const meta: Meta<typeof Deck> = {
  component: Deck,
  title: 'Campfire/Deck'
}

export default meta

/**
 * Renders the Deck story with three slides and transitions.
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
      <h2 class='text-4xl'>Fade Slide</h2>
    </Slide>
    <Slide
      transition={{
        enter: { type: 'slide', dir: 'left', duration: 300 },
        exit: { type: 'slide', dir: 'right', duration: 300 }
      }}
    >
      <h2 class='text-4xl'>Slide Transition</h2>
    </Slide>
    <Slide
      transition={{
        enter: { type: 'zoom', duration: 300 },
        exit: { type: 'zoom', duration: 300 }
      }}
    >
      <h2 class='text-4xl'>Zoom Slide</h2>
    </Slide>
  </Deck>
)

export const WithTransitions: StoryObj<typeof Deck> = { render }
