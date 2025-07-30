import { createRoot } from 'react-dom/client'
import './index.css'
import { Story } from './Story'

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(<Story />)
}
