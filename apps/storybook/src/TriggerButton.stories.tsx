import type { Meta, StoryObj } from '@storybook/preact'
import { h } from 'preact'
import { TriggerButton } from '@campfire/components'

const meta: Meta<typeof TriggerButton> = {
  component: TriggerButton,
  title: 'Campfire/TriggerButton'
}

export default meta

/**
 * Shows TriggerButton in enabled and disabled states.
 *
 * @returns Two TriggerButton examples.
 */
export const States: StoryObj<typeof TriggerButton> = {
  render: () => (
    <div className='flex gap-2'>
      <TriggerButton content='[]'>Enabled</TriggerButton>
      <TriggerButton content='[]' disabled>
        Disabled
      </TriggerButton>
    </div>
  )
}
