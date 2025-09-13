import { scanDirectives } from '@campfire/utils/scanDirectives'
import { shouldStripDirectiveIndent } from '@campfire/utils/shouldStripDirectiveIndent'

/**
 * Normalizes directive indentation so Markdown treats directive lines the same
 * regardless of leading spaces or tabs.
 *
 * @param input - Raw passage text.
 * @returns Passage text with directive indentation normalized.
 */
const normalizeDirectiveIndentation = (input: string): string => {
  let output = ''
  let lineStart = 0
  for (const token of scanDirectives(input)) {
    if (token.type === 'text') {
      output += token.value
    } else {
      const indent = output.slice(lineStart).match(/^[\t ]*/)?.[0] ?? ''
      if (shouldStripDirectiveIndent(indent))
        output = output.slice(0, lineStart)
      output += token.value
    }
    const lastNewline = token.value.lastIndexOf('\n')
    if (lastNewline !== -1) {
      lineStart = output.length - (token.value.length - lastNewline - 1)
    }
  }
  return output
}

export type WorkerRequest = { id: number; text: string }
export type WorkerResponse = { id: number; result: string }

/**
 * Responds to messages from the main thread with normalized passage text.
 *
 * @param event - Message containing raw passage text.
 */
self.onmessage = event => {
  const { id, text } = event.data as WorkerRequest
  const result = normalizeDirectiveIndentation(text)
  self.postMessage({ id, result } as WorkerResponse)
}

export {}
