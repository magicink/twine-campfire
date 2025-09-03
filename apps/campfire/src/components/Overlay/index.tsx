import { useOverlayStore } from '@campfire/state/useOverlayStore'
import { h } from 'preact'

/**
 * Renders persistent overlay components above the current passage.
 *
 * @returns Container with all processed overlays.
 */
export const Overlay = () => {
  const overlays = useOverlayStore.use.overlays()
  return (
    <div
      className='campfire-overlay absolute inset-0 pointer-events-none'
      data-testid='overlay'
    >
      {overlays
        .filter(o => o.visible)
        .map(item => (
          <div
            key={item.name}
            className='pointer-events-auto'
            style={{ zIndex: item.zIndex }}
          >
            {item.component}
          </div>
        ))}
    </div>
  )
}
