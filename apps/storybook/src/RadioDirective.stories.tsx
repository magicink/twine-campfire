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
:preset{type="wrapper" name="radioLabel" as="div" className="flex items-center gap-2"}
::set[choice="b"]
:::layer{className="flex gap-[12px] items-center justify-center"}
  :::wrapper{from="radioLabel"}
    :radio[choice]{value="a"}
    Hi
  :::
  :::wrapper{from="radioLabel"}
    :radio[choice]{value="b"}
    Hello
  :::
  :::wrapper{from="radioLabel"}
    :radio[choice]{value="c" disabled="true"}
    Goodbye
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
  :::layer{className="flex gap-[4px] items-center justify-center"}
    :input[choice]{type='radio' value='a'}
    :input[choice]{type='radio' value='b' checked}
    :input[choice]{type='radio' value='c' disabled='true'}
  :::
`}
        </tw-passagedata>
      </tw-storydata>
      <Campfire />
    </>
  )
}
