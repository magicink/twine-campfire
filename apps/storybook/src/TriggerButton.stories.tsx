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
      <TriggerButton>Enabled</TriggerButton>
      <TriggerButton disabled>Disabled</TriggerButton>
    </div>
  )
}

/**
 * Displays a TriggerButton with custom inline styles.
 *
 * @returns A styled TriggerButton example.
 */
export const Styled: StoryObj<typeof TriggerButton> = {
  render: () => (
    <TriggerButton
      style={{
        backgroundColor: 'var(--color-primary-500)',
        color: 'var(--color-primary-foreground)'
      }}
    >
      Styled
    </TriggerButton>
  )
}
