import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'
import { DebugWindow } from '../DebugWindow'
import { TwPassagedata, TwStorydata } from '../TwineElements'

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
      <TwStorydata startnode='1' options='debug'>
        <TwPassagedata pid='1' name='Start'>
          {`
:::deck{size="800x600"}
  :::slide
      :::layer{x=120 y=160 w=200 h=100 className="bg-[var(--color-primary-500)] text-[var(--color-gray-950)] flex items-center justify-center"}
      Inside Layer
    :::
  :::
:::
`}
        </TwPassagedata>
      </TwStorydata>
      <Campfire />
      <DebugWindow />
    </>
  )
}
