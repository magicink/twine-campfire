import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'

const meta: Meta = {
  title: 'Campfire/Directives/Radio'
}

export default meta

/**
 * Demonstrates the `radio` directive bound to game state.
 *
 * @returns Campfire story showcasing the `radio` directive.
 */
export const Basic: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
:radio[choice]{value="a"}
:radio[choice]{value="b" checked}
`}
        </tw-passagedata>
      </tw-storydata>
      <Campfire />
    </>
  )
}

/**
 * Demonstrates using the `input` directive with `type="radio"`.
 *
 * @returns Campfire story showcasing radio inputs via the `input` directive.
 */
export const AsInput: StoryObj = {
  render: () => (
    <>
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
:input[choice]{type='radio' value='a'}
:input[choice]{type='radio' value='b' checked}
`}
        </tw-passagedata>
      </tw-storydata>
      <Campfire />
    </>
  )
}
