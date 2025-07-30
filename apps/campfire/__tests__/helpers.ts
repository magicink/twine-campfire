import type { Element } from 'hast'

export const samplePassage: Element = {
  type: 'element',
  tagName: 'tw-passagedata',
  properties: { pid: '1', name: 'Start' },
  children: [{ type: 'text', value: 'Hello world' }]
}
