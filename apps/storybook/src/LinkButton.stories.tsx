import type { Meta, StoryObj } from '@storybook/preact'
import { h } from 'preact'
import { LinkButton } from '@campfire/components'

const meta: Meta<typeof LinkButton> = {
  component: LinkButton,
  title: 'Campfire/Components/LinkButton'
}

export default meta

/**
 * Shows LinkButton in enabled and disabled states.
 *
 * @returns Two LinkButton examples.
 */
export const States: StoryObj<typeof LinkButton> = {
  render: () => (
    <div className='flex gap-2'>
      <LinkButton>Enabled</LinkButton>
      <LinkButton disabled>Disabled</LinkButton>
    </div>
  )
}
