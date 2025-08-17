import type { Meta, StoryObj } from '@storybook/preact'
import { h } from 'preact'
import { Deck, Slide, DeckText, Appear } from '@campfire/components'

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
        <DeckText as='h2' x={200} y={200} size={36}>
          Fade Slide
        </DeckText>
      </Appear>
      <Appear at={1}>
        <DeckText x={500} y={400} size={24}>
          Second step
        </DeckText>
      </Appear>
      <Appear at={2}>
        <DeckText x={500} y={500} size={24}>
          Third step
        </DeckText>
      </Appear>
    </Slide>
    <Slide
      transition={{
        enter: { type: 'slide', dir: 'left', duration: 300 },
        exit: { type: 'slide', dir: 'right', duration: 300 }
      }}
    >
      <Appear at={0}>
        <DeckText as='h2' x={200} y={200} size={36}>
          Slide Transition
        </DeckText>
      </Appear>
      <Appear at={1}>
        <DeckText x={500} y={400} size={24}>
          Second step
        </DeckText>
      </Appear>
    </Slide>
    <Slide
      transition={{
        enter: { type: 'zoom', duration: 300 },
        exit: { type: 'zoom', duration: 300 }
      }}
    >
      <Appear at={0}>
        <DeckText as='h2' x={200} y={200} size={36}>
          Zoom Slide
        </DeckText>
      </Appear>
      <Appear at={1}>
        <DeckText x={500} y={400} size={24}>
          Second step
        </DeckText>
      </Appear>
    </Slide>
    <Slide
      transition={{
        enter: { type: 'fade', duration: 400 },
        exit: { type: 'fade', duration: 400 }
      }}
    >
      <Appear at={0}>
        <DeckText as='h2' x={200} y={200} size={36}>
          Flip Slide
        </DeckText>
      </Appear>
      <Appear at={1}>
        <DeckText x={260} y={260} size={28}>
          Second step
        </DeckText>
      </Appear>
      <Appear at={2}>
        <DeckText x={320} y={320} size={24}>
          Third step
        </DeckText>
      </Appear>
      <Appear at={3}>
        <DeckText x={440} y={440} size={20}>
          Fourth step
        </DeckText>
      </Appear>
    </Slide>
  </Deck>
)

export const WithTransitions: StoryObj<typeof Deck> = { render }

/**
 * Demonstrates overriding default accessibility labels for the Deck component.
 *
 * @returns The rendered Deck element with custom a11y labels.
 */
export const WithCustomLabels: StoryObj<typeof Deck> = {
  render: () => (
    <Deck
      className='w-[800px] h-[600px]'
      a11y={{
        deck: 'Slide deck',
        next: 'Advance',
        prev: 'Go back',
        slide: (i, t) => `Page ${i} of ${t}`,
        step: (c, t) => `Point ${c} of ${t}`
      }}
    >
      <Slide>
        <DeckText as='h2' x={200} y={200} size={36}>
          First Slide
        </DeckText>
      </Slide>
      <Slide>
        <DeckText as='h2' x={200} y={200} size={36}>
          Second Slide
        </DeckText>
      </Slide>
    </Deck>
  )
}
