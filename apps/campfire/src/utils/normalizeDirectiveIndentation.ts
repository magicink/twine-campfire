import { scanDirectives } from './scanDirectives'
import { shouldStripDirectiveIndent } from './shouldStripDirectiveIndent'

/**
 * Inserts a newline between adjacent container directive markers that Twine
 * may have collapsed by trimming whitespace (e.g., `::::::wrapper`).
 *
 * @param input - Raw passage text to normalize.
 * @returns Input text with container boundaries restored.
 */
const restoreContainerBoundaries = (input: string): string => {
  let output = ''
  let index = 0
  while (index < input.length) {
    if (input.startsWith(':::', index)) {
      const start = index
      output += ':::'
      index += 3
      const prevChar = start > 0 ? (input[start - 1] ?? '') : ''
      if (input.startsWith(':::', index) && !/[A-Za-z0-9]/.test(prevChar)) {
        output += '\n'
      }
    } else {
      output += input[index] ?? ''
      index += 1
    }
  }
  return output
}

/**
 * Normalizes directive indentation so Markdown treats directive lines the same
 * regardless of leading spaces or tabs. Walks the source once using
 * {@link scanDirectives} and strips tabs or four-or-more spaces before
 * directive markers.
 *
 * @param input - Raw passage text.
 * @returns Passage text with directive indentation normalized.
 */
export const normalizeDirectiveIndentation = (input: string): string => {
  const source = restoreContainerBoundaries(input)
  let output = ''
  let lineStart = 0
  for (const token of scanDirectives(source)) {
    if (token.type === 'text') {
      output += token.value
    } else {
      const indent = output.slice(lineStart).match(/^[\t ]*/)?.[0] ?? ''
      if (shouldStripDirectiveIndent(indent))
        output = output.slice(0, lineStart)
      output += token.value
    }
    const lastNewline = token.value.lastIndexOf('\n')
    if (lastNewline !== -1)
      lineStart = output.length - (token.value.length - lastNewline - 1)
  }
  return output
}
