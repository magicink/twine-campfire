import type { Meta, StoryObj } from '@storybook/preact'
import { h } from 'preact'
import { Deck, Slide, SlideText, Appear } from '@campfire/components'

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
        <SlideText as='h2' x={200} y={200} size={36}>
          Fade Slide
        </SlideText>
      </Appear>
      <Appear at={1}>
        <SlideText x={500} y={400} size={24}>
          Second step
        </SlideText>
      </Appear>
      <Appear at={2}>
        <SlideText x={500} y={500} size={24}>
          Third step
        </SlideText>
      </Appear>
    </Slide>
    <Slide
      transition={{
        enter: { type: 'slide', dir: 'left', duration: 300 },
        exit: { type: 'slide', dir: 'right', duration: 300 }
      }}
    >
      <Appear at={0}>
        <SlideText as='h2' x={200} y={200} size={36}>
          Slide Transition
        </SlideText>
      </Appear>
      <Appear at={1}>
        <SlideText x={500} y={400} size={24}>
          Second step
        </SlideText>
      </Appear>
    </Slide>
    <Slide
      transition={{
        enter: { type: 'zoom', duration: 300 },
        exit: { type: 'zoom', duration: 300 }
      }}
    >
      <Appear at={0}>
        <SlideText as='h2' x={200} y={200} size={36}>
          Zoom Slide
        </SlideText>
      </Appear>
      <Appear at={1}>
        <SlideText x={500} y={400} size={24}>
          Second step
        </SlideText>
      </Appear>
    </Slide>
    <Slide
      transition={{
        enter: { type: 'fade', duration: 400 },
        exit: { type: 'fade', duration: 400 }
      }}
    >
      <Appear at={0}>
        <SlideText as='h2' x={200} y={200} size={36}>
          Flip Slide
        </SlideText>
      </Appear>
      <Appear at={1}>
        <SlideText x={260} y={260} size={28}>
          Second step
        </SlideText>
      </Appear>
      <Appear at={2}>
        <SlideText x={320} y={320} size={24}>
          Third step
        </SlideText>
      </Appear>
      <Appear at={3}>
        <SlideText x={440} y={440} size={20}>
          Fourth step
        </SlideText>
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
        slide: (i, t) => `Page ${i} of ${t}`
      }}
    >
      <Slide>
        <SlideText as='h2' x={200} y={200} size={36}>
          First Slide
        </SlideText>
      </Slide>
      <Slide>
        <SlideText as='h2' x={200} y={200} size={36}>
          Second Slide
        </SlideText>
      </Slide>
    </Deck>
  )
}

/**
 * Demonstrates enabling the slide counter HUD.
 *
 * @returns The rendered Deck element showing the slide counter.
 */
export const WithSlideCounter: StoryObj<typeof Deck> = {
  render: () => (
    <Deck className='w-[800px] h-[600px]' showSlideCount>
      <Slide>
        <SlideText as='h2' x={200} y={200} size={36}>
          Slide Counter
        </SlideText>
      </Slide>
    </Deck>
  )
}

/**
 * Demonstrates that navigation controls are disabled at the start and end of
 * the deck.
 *
 * @returns The rendered Deck element showcasing disabled navigation buttons.
 */
export const WithDisabledControls: StoryObj<typeof Deck> = {
  render: () => (
    <Deck className='w-[800px] h-[600px]'>
      <Slide>
        <SlideText as='h2' x={200} y={200} size={36}>
          Start
        </SlideText>
      </Slide>
      <Slide>
        <SlideText as='h2' x={200} y={200} size={36}>
          End
        </SlideText>
      </Slide>
    </Deck>
  )
}

/**
 * Demonstrates automatically advancing slides after a delay. Autoplay pauses
 * once the final appear of the last slide is revealed.
 *
 * @returns The rendered Deck element with autoplay.
 */
export const WithAutoplay: StoryObj<typeof Deck> = {
  render: () => (
    <Deck className='w-[800px] h-[600px]' autoAdvanceMs={1000}>
      <Slide>
        <SlideText as='h2' x={200} y={200} size={36}>
          Auto 1
        </SlideText>
      </Slide>
      <Slide>
        <Appear at={0}>
          <SlideText as='h2' x={200} y={200} size={36}>
            Auto 2
          </SlideText>
        </Appear>
        <Appear at={1}>
          <SlideText x={200} y={260} size={24}>
            Final Step
          </SlideText>
        </Appear>
      </Slide>
    </Deck>
  )
}

/**
 * Demonstrates autoplay starting in a paused state with a play control.
 *
 * @returns The rendered Deck element with paused autoplay.
 */
export const WithAutoplayPaused: StoryObj<typeof Deck> = {
  render: () => (
    <Deck
      className='w-[800px] h-[600px]'
      autoAdvanceMs={1000}
      autoAdvancePaused
    >
      <Slide>
        <SlideText as='h2' x={200} y={200} size={36}>
          Paused 1
        </SlideText>
      </Slide>
      <Slide>
        <SlideText as='h2' x={200} y={200} size={36}>
          Paused 2
        </SlideText>
      </Slide>
    </Deck>
  )
}

/**
 * Demonstrates hiding navigation controls.
 *
 * @returns The rendered Deck element without navigation.
 */
export const WithHiddenNavigation: StoryObj<typeof Deck> = {
  render: () => (
    <Deck className='w-[800px] h-[600px]' hideNavigation>
      <Slide>
        <SlideText as='h2' x={200} y={200} size={36}>
          Hidden Nav
        </SlideText>
      </Slide>
    </Deck>
  )
}
