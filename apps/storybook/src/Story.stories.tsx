import type { Meta, StoryObj } from '@storybook/preact'
import { h, Fragment } from 'preact'
import { Campfire } from '@campfire/components'

const meta: Meta = {
  title: 'Campfire/Twine Elements'
}

export default meta

// A super-minimal story that renders TwineJS custom elements directly in JSX.
// This validates our JSX and DOM typings for these tags.
export const InDom: StoryObj = {
  render: () => (
    <Fragment>
      <tw-storydata
        name='Storybook Demo'
        startnode='1'
        data-demo={true}
        tags='demo'
        options='debug'
      >
        <tw-passagedata pid='1' name='Start'>
          {`
# Hello World!

:set[test=true]

:::trigger{label="Click me"}
  :set[test=false]
:::

:::if{!test}
[[Go to second passage->Second]]
:::
`}
        </tw-passagedata>
        <tw-passagedata pid='2' name='Second'>
          Second passage
        </tw-passagedata>
      </tw-storydata>
      <tw-story data-mounted='yes'>
        <tw-sidebar></tw-sidebar>
        <tw-link name='Go' type='internal' data-target='2'></tw-link>
        <tw-hook name='content'></tw-hook>
        <tw-enchantment></tw-enchantment>
      </tw-story>
      <Campfire />
    </Fragment>
  )
}
