import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'
import { DebugWindow } from '../DebugWindow'
import { TwPassagedata, TwStorydata } from '../TwineElements'

const meta: Meta = {
  title: 'Campfire/Directives/Input'
}

export default meta

/**
 * Demonstrates the `input` directive bound to game state.
 *
 * @returns Campfire story showcasing the `input` directive.
 */
export const Basic: StoryObj = {
  render: () => (
    <>
      <TwStorydata startnode='1' options='debug'>
        <TwPassagedata pid='1' name='Start'>
          {`
:input[name]{placeholder="Type your name"}
:::if[name]
  Hello, :show[name]{className="text-green-600"}!
:::
`}
        </TwPassagedata>
      </TwStorydata>
      <Campfire />
      <DebugWindow />
    </>
  )
}

/**
 * Demonstrates the `input` directive with event directives.
 *
 * @returns Campfire story showcasing input events.
 */
export const WithEvents: StoryObj = {
  render: () => (
    <>
      <TwStorydata startnode='1' options='debug'>
        <TwPassagedata pid='1' name='Start'>
          {`
:::input[name]{placeholder="Hover or focus"}
  :::onFocus
    ::set[focused=true]
  :::
  :::onBlur
    ::unset[focused]
  :::
:::

:::if[focused]
  Focused!
:::

:::if[name]
  Hello, :show[name]{className="text-green-600"}!
:::
          `}
        </TwPassagedata>
      </TwStorydata>
      <Campfire />
      <DebugWindow />
    </>
  )
}
