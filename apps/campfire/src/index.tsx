import { render } from 'preact'
import { Story } from '@campfire/components'

const root = document.getElementById('story-root')
if (root) {
  render(<Story />, root)
}
