import type { Meta, StoryObj } from '@storybook/preact'
import { h } from 'preact'
import { Overlay } from '@campfire/components'
import { useOverlayStore } from '@campfire/state/useOverlayStore'

const meta: Meta<typeof Overlay> = {
  component: Overlay,
  title: 'Campfire/Overlay'
}

export default meta

/**
 * Displays a simple overlay component.
 */
export const Default: StoryObj<typeof Overlay> = {
  render: () => {
    useOverlayStore.getState().setOverlays([
      {
        name: 'sample',
        component: <div>Sample Overlay</div>,
        visible: true,
        zIndex: 0
      }
    ])
    return <Overlay />
  }
}
