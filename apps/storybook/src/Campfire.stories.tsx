import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'

const meta: Meta = {
  title: 'Campfire'
}

export default meta

// A super-minimal story that renders TwineJS custom elements directly in JSX.
// This validates our JSX and DOM typings for these tags.
export const Triggers: StoryObj = {
  render: () => (
    <>
      <tw-storydata
        name='Storybook Demo'
        startnode='1'
        data-demo={true}
        tags='demo'
        options='debug'
      >
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
export const Deck: StoryObj = {
  render: () => (
    <>
      <tw-storydata
        name='Storybook Demo'
        startnode='1'
        data-demo={true}
        tags='demo'
        options='debug'
      >
        <tw-passagedata pid='1' name='Start'>
          {`
:::deck{size=800x600}
  :::slide{transition=fade}
    :::appear{at=0}
      :::text{x=80 y=80 as="h2"}
      Hello
      :::
    :::
    :::appear{at=1}
      :::text{x=100 y=100 as="h2"}
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
