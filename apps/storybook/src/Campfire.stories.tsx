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
:::deck{size='800x600'}
  :::slide{transition='fade'}
    :::appear{at=0}
      :text[Hello]{x=80 y=80 as="h2"}
    :::
    :shape{x=150 y=150 w=100 h=50 type='rect' stroke='blue' fill='#ddf' radius=8 shadow=true}
    :::appear{at=1}
      :text[World]{x=100 y=100 as="h2"}
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
