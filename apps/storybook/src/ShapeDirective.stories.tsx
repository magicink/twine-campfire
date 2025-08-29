import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'

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
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
:::deck{size="800x600"}
  :::slide
    :shape{type='rect' x=120 y=120 w=120 h=80 fill='var(--color-primary-400)' stroke='var(--color-primary-100)'}
    :shape{type='ellipse' x=400 y=160 w=100 h=100 fill='var(--color-destructive-300)' stroke='var(--color-destructive-700)' className='opacity-75'}
  :::
:::
          `}
        </tw-passagedata>
      </tw-storydata>
      <Campfire />
    </>
  )
}
