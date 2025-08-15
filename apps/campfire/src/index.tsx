import { render } from 'preact'
import { Campfire } from '@campfire/components'

const root = document.getElementById('story-root')
if (root) {
  render(<Campfire />, root)
}
