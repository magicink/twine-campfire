import type { Meta, StoryObj } from '@storybook/preact'
import { h } from 'preact'

/**
 * Renders a button with basic Tailwind styling.
 * @param props - Component properties.
 * @param props.label - Text displayed inside the button.
 * @returns The rendered button element.
 */
const Button = ({ label }: { label: string }) => (
  <button class='px-4 py-2 rounded bg-gray-200 text-gray-900'>{label}</button>
)

const meta: Meta<{ label: string }> = {
  component: Button,
  title: 'Example/Button'
}

export default meta

export const Primary: StoryObj<{ label: string }> = {
  args: { label: 'Button' }
}
