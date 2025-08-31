import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'

const meta: Meta = {
  title: 'Campfire/Directives/Wrapper'
}

export default meta

/**
 * Wraps content in basic HTML tags using the `wrapper` directive.
 *
 * @returns Campfire story showcasing the `wrapper` directive.
 */
export const Basic: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
:::deck{size="800x600"}
  :::slide
    :::layer{x=200 y=240 w=400 h=120}
      :::wrapper{as="p" className="bg-[var(--color-primary-500)] text-[var(--color-gray-950)] flex items-center justify-center p-4"}
        Wrapped content
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

/**
 * Demonstrates wrapper events such as mouse enter and exit interactions.
 *
 * @returns Campfire story showcasing wrapper event directives.
 */
export const WithEvents: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
:set[enter=false]
:set[exit=false]

:::wrapper{as="button" className="bg-[var(--color-primary-500)] text-[var(--color-gray-950)] p-4"}
:::onMouseEnter
  :set[enter=true]
  :set[exit=false]
:::
:::onMouseExit
  :set[enter=false]
  :set[exit=true]
:::

Hover me

:::

:::if[enter]

You hovered the wrapper!

:::

:::if[exit]

You left the wrapper!

:::
          `}
        </tw-passagedata>
      </tw-storydata>
      <Campfire />
    </>
  )
}
