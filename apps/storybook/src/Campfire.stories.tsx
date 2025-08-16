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
      <tw-story data-mounted='yes'>
        <tw-sidebar></tw-sidebar>
        <tw-link name='Go' type='internal' data-target='2'></tw-link>
        <tw-hook name='content'></tw-hook>
        <tw-enchantment></tw-enchantment>
      </tw-story>
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
    :::appear{at=0 x=80 y=80}
    Hello
    :::

    :::appear{at=1 x=100 y=100}
    World
    :::
  :::

:::
`}
        </tw-passagedata>
      </tw-storydata>
      <tw-story data-mounted='yes'>
        <tw-sidebar></tw-sidebar>
        <tw-link name='Go' type='internal' data-target='2'></tw-link>
        <tw-hook name='content'></tw-hook>
        <tw-enchantment></tw-enchantment>
      </tw-story>
      <Campfire />
    </>
  )
}
