import { createRoot } from 'react-dom/client'
import './index.css'
import { Story } from './Story'

const root = document.getElementById('story-root')
if (root) {
  createRoot(root).render(<Story />)
}
