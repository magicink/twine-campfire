import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'
import { DebugWindow } from '../DebugWindow'
import { TwPassagedata, TwStorydata } from '../TwineElements'

const meta: Meta = {
  title: 'Campfire/Directives/Shape'
}

export default meta

/**
 * Draws basic shapes within a slide using the `shape` directive.
 *
 * @returns Campfire story showcasing the `shape` directive.
 */
export const Basic: StoryObj = {
  render: () => (
    <>
      <TwStorydata startnode='1' options='debug'>
        <TwPassagedata pid='1' name='Start'>
          {`
:::deck{size="800x600"}
  :::slide
    :shape{type='rect' x=120 y=120 w=120 h=80 fill='#60a5fa' stroke='#1e3a8a'}
    :shape{type='ellipse' x=400 y=160 w=100 h=100 fill='#facc15' stroke='#92400e' className='opacity-75'}
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
