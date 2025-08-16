import type { Meta, StoryObj } from '@storybook/preact'
import { h, Fragment } from 'preact'
import { Campfire } from '@campfire/components'

const meta: Meta = {
  title: 'Campfire/Twine Elements'
}

export default meta

/**
 * Renders TwineJS custom elements directly in JSX and demonstrates the
 * `deck`, `slide`, and `appear` directives.
 *
 * @returns The rendered story elements.
 */
const render: StoryObj['render'] = () => (
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

:::deck{class="w-[800px] h-[600px]"}
:::slide
:::appear{at=0}
# First Slide
:::
:::appear{at=1}
This line appears second.
:::
:::
:::slide
:::appear{at=0}
# Second Slide
:::
:::appear{at=1}
This line appears second.
:::
:::
:::slide
:::appear{at=0}
# Third Slide
:::
:::appear{at=1}
This line appears second.
:::
:::
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

export const InDom: StoryObj = { render }
