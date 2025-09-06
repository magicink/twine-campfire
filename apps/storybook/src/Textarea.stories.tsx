import type { Meta, StoryObj } from '@storybook/preact'
import { Textarea } from '@campfire/components'

const meta: Meta<typeof Textarea> = {
  component: Textarea,
  title: 'Campfire/Components/Textarea'
}

export default meta

/**
 * Displays a basic Textarea with a placeholder.
 *
 * @returns A Textarea example.
 */
export const Basic: StoryObj<typeof Textarea> = {
  render: () => (
    <Textarea stateKey='bio' className={['p-2']} placeholder='Your bio' />
  )
}

/**
 * Shows Textarea elements with different row counts.
 *
 * @returns Textarea examples with varying rows.
 */
export const Rows: StoryObj<typeof Textarea> = {
  render: () => (
    <div className='flex gap-2'>
      <Textarea stateKey='short' rows={2} placeholder='Short' />
      <Textarea stateKey='long' rows={5} placeholder='Long' />
    </div>
  )
}
