import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'

const meta: Meta = {
  title: 'Campfire/Directives'
}

export default meta

// A super-minimal story that renders TwineJS custom elements directly in JSX.
// This validates our JSX and DOM typings for these tags.
export const Trigger: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
:set[test=true]

:::trigger{label="Click me"}
  :set[test=false]
:::

:::if{!test}
You clicked the button!
:::

:::onExit
  :unset[test]
:::
`}
        </tw-passagedata>
      </tw-storydata>
      <Campfire />
    </>
  )
}

// Expected component composition of the Deck directives below (JSX-style):
// <Deck size={{ width: 800, height: 600 }}>
//   <Slide transition={{ type: 'fade' }}>
//     <Appear at={0}>
//       <SlideText as="h2" x={80} y={80}>Hello</SlideText>
//     </Appear>
//     <Appear at={1}>
//       <SlideShape type="rect" x={150} y={150} w={100} h={50} stroke="blue" fill="#ddf" radius={8} shadow className="opacity-25" />
//     </Appear>
//     <Appear at={2}>
//       <SlideText as="h2" x={100} y={100}>World</SlideText>
//     </Appear>
//   </Slide>
// </Deck>
export const Deck: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
:preset{type="text" name="title" x=80 y=80 as="p" size=36}

:::deck{size='800x600'}
  :::slide{transition='fade'}
    :::appear{at=0}
      :::text{from="title"}
      Hello
      :::
    :::
    :::appear{at=1}
      :shape{x=150 y=150 w=100 h=50 type='rect' stroke='blue' fill='#ddf' radius=8 shadow=true className='opacity-25'}
    :::
    :::appear{at=2}
      :::text{from="title" x=100 y=100}
      World
      :::
    :::
  :::
:::
`}
        </tw-passagedata>
      </tw-storydata>
      <Campfire />
    </>
  )
}

/** Story with two passages, each containing its own deck of slides. */
export const MultiPassageDecks: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
[[Next->Second]]

  :::deck{size='400x300'}
    :::slide
      :::appear{at=0}
        :::text{x=20 y=120}
        First deck 1
        :::
      :::
      :::appear{at=1}
        :::text{x=20 y=160}
        First deck 2
        :::
      :::
    :::
  :::
  `}
        </tw-passagedata>
        <tw-passagedata pid='2' name='Second'>
          {`
  [[Back->Start]]

  :::deck{size='400x300'}
    :::slide
      :::appear{at=0}
        :::text{x=20 y=120}
        Second deck 1
        :::
      :::
      :::appear{at=1}
        :::text{x=20 y=160}
        Second deck 2
        :::
      :::
    :::
  :::
  `}
        </tw-passagedata>
      </tw-storydata>
      <Campfire />
    </>
  )
}
