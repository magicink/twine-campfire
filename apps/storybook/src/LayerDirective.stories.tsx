import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'

const meta: Meta = {
  title: 'Campfire/Directives/Layer'
}

export default meta

/**
 * Demonstrates the `layer` directive positioning child content.
 *
 * @returns Campfire story showcasing the `layer` directive.
 */
export const Basic: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
:::deck{size="800x600"}
  :::slide
    :::layer{x=120 y=160 w=200 h=100 class="bg-blue-500 text-white flex items-center justify-center"}
      Inside Layer
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
