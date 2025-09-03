import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'

const meta: Meta = {
  title: 'Campfire/Directives/Trigger'
}

export default meta

/**
 * Demonstrates the `trigger` directive toggling state and cleaning up on exit.
 *
 * @returns Campfire story showcasing the `trigger` directive.
 */
export const Basic: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
::set[test=true]

:::trigger{label="Click me"}
  ::set[test=false]
:::

:::if[!test]

You clicked the button!

:::

:::onExit
  ::unset{key=test}
:::
`}
        </tw-passagedata>
      </tw-storydata>
      <Campfire />
    </>
  )
}

/**
 * Demonstrates trigger events such as mouse enter.
 *
 * @returns Campfire story showcasing trigger event directives.
 */
export const WithEvents: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
::set[hover=false]

:::trigger{label="Hover"}
:::onMouseEnter
  ::set[hover=true]
:::
:::

:::if[hover]

You hovered the button!

:::
          `}
        </tw-passagedata>
      </tw-storydata>
      <Campfire />
    </>
  )
}

/**
 * Demonstrates using a wrapper inside a trigger to render a rich label
 * with an inline image next to text. The wrapper becomes the button’s label.
 */
export const WithWrapperLabel: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
::set[clicked=false]

:::deck{size="1280x720"}

  :::slide

    :::layer{className='flex items-center justify-center mx-auto w-full top-1/3'}

      :::trigger{className='flex items-center cursor-pointer pl-0'}
        ::set[clicked=true]
        :::wrapper{as="span" className="inline-flex items-center gap-2"}
          ![cat](https://placecats.com/neo/50/50)
          Click the cat
        :::
      :::

    :::

    :::if[clicked]
      :::layer{className='flex items-center justify-center top-1/2 absolute w-full'}
        You clicked the cat button!
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
