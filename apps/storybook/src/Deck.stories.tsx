import type { Meta, StoryObj } from '@storybook/preact'
import { h } from 'preact'
import { Deck, Slide, SlideText, SlideReveal } from '@campfire/components'

const meta: Meta<typeof Deck> = {
  component: Deck,
  title: 'Campfire/Deck'
}

export default meta

/**
 * Renders the Deck story with three slides and transitions using the SlideReveal
 * component to progressively reveal content. The first slide demonstrates
 * three sequential SlideReveal elements to showcase entrance and exit animations.
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
      <SlideReveal at={0}>
        <SlideText as='h2' x={200} y={200} size={36}>
          Fade Slide
        </SlideText>
      </SlideReveal>
      <SlideReveal at={1}>
        <SlideText x={500} y={400} size={24}>
          Second step
        </SlideText>
      </SlideReveal>
      <SlideReveal at={2}>
        <SlideText x={500} y={500} size={24}>
          Third step
        </SlideText>
      </SlideReveal>
    </Slide>
    <Slide
      transition={{
        enter: { type: 'slide', dir: 'left', duration: 300 },
        exit: { type: 'slide', dir: 'right', duration: 300 }
      }}
    >
      <SlideReveal at={0}>
        <SlideText as='h2' x={200} y={200} size={36}>
          Slide Transition
        </SlideText>
      </SlideReveal>
      <SlideReveal at={1}>
        <SlideText x={500} y={400} size={24}>
          Second step
        </SlideText>
      </SlideReveal>
    </Slide>
    <Slide
      transition={{
        enter: { type: 'zoom', duration: 300 },
        exit: { type: 'zoom', duration: 300 }
      }}
    >
      <SlideReveal at={0}>
        <SlideText as='h2' x={200} y={200} size={36}>
          Zoom Slide
        </SlideText>
      </SlideReveal>
      <SlideReveal at={1}>
        <SlideText x={500} y={400} size={24}>
          Second step
        </SlideText>
      </SlideReveal>
    </Slide>
    <Slide
      transition={{
        enter: { type: 'flip', duration: 400 },
        exit: { type: 'flip', duration: 400 }
      }}
    >
      <SlideReveal at={0}>
        <SlideText as='h2' x={200} y={200} size={36}>
          Flip Slide
        </SlideText>
      </SlideReveal>
      <SlideReveal at={1}>
        <SlideText x={260} y={260} size={28}>
          Second step
        </SlideText>
      </SlideReveal>
      <SlideReveal at={2}>
        <SlideText x={320} y={320} size={24}>
          Third step
        </SlideText>
      </SlideReveal>
      <SlideReveal at={3}>
        <SlideText x={440} y={440} size={20}>
          Fourth step
        </SlideText>
      </SlideReveal>
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
 * once the final reveal of the last slide is shown.
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
        <SlideReveal at={0}>
          <SlideText as='h2' x={200} y={200} size={36}>
            Auto 2
          </SlideText>
        </SlideReveal>
        <SlideReveal at={1}>
          <SlideText x={200} y={260} size={24}>
            Final Step
          </SlideText>
        </SlideReveal>
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

/**
 * Demonstrates overriding slide group classes using the groupClassName prop.
 *
 * @returns The rendered Deck element with custom group styling.
 */
export const WithGroupClassName: StoryObj<typeof Deck> = {
  render: () => (
    <Deck
      className='w-[800px] h-[600px]'
      groupClassName='rounded-none shadow-none'
    >
      <Slide>
        <SlideText as='h2' x={200} y={200} size={36}>
          Custom Group
        </SlideText>
      </Slide>
    </Deck>
  )
}

/**
 * Demonstrates overriding navigation and HUD classes.
 *
 * @returns The rendered Deck element with custom navigation and HUD styling.
 */
export const WithNavAndHudClassNames: StoryObj<typeof Deck> = {
  render: () => (
    <Deck
      className='w-[800px] h-[600px]'
      navClassName='justify-between'
      hudClassName='left-3 right-auto'
      showSlideCount
    >
      <Slide>
        <SlideText as='h2' x={200} y={200} size={36}>
          Custom Nav & HUD
        </SlideText>
      </Slide>
    </Deck>
  )
}
