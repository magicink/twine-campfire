import type { Meta, StoryObj } from '@storybook/preact'
import { h } from 'preact'
import { Input } from '@campfire/components'

const meta: Meta<typeof Input> = {
  component: Input,
  title: 'Campfire/Input'
}

export default meta

/**
 * Displays a basic Input with a placeholder.
 *
 * @returns An Input example.
 */
export const Basic: StoryObj<typeof Input> = {
  render: () => <Input stateKey='name' placeholder='Your name' /> // simple example
}

/**
 * Shows Input elements with different types.
 *
 * @returns Text and password Input examples.
 */
export const Types: StoryObj<typeof Input> = {
  render: () => (
    <div className='flex gap-2'>
      <Input stateKey='username' placeholder='Username' />
      <Input stateKey='password' type='password' placeholder='Password' />
    </div>
  )
}

/**
 * Demonstrates a file Input.
 *
 * @returns File upload Input example.
 */
export const File: StoryObj<typeof Input> = {
  render: () => <Input stateKey='upload' type='file' />
}
