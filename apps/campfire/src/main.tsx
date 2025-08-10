import { render } from 'preact'
import { Story } from './Story'

const root = document.getElementById('story-root')
if (root) {
  render(<Story />, root)
}
