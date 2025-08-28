import { useOverlayStore } from '@campfire/state/useOverlayStore'
import { h } from 'preact'

/**
 * Renders persistent overlay components above the current passage.
 *
 * @returns Container with all processed overlays.
 */
export const Overlay = () => {
  const overlays = useOverlayStore(state => state.overlays)
  return (
    <div
      className='campfire-overlay absolute inset-0 pointer-events-none'
      data-testid='overlay'
    >
      {overlays.map(item => (
        <div key={item.name} className='pointer-events-auto'>
          {item.component}
        </div>
      ))}
    </div>
  )
}
