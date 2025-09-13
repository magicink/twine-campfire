import { scanDirectives } from './scanDirectives'
import { shouldStripDirectiveIndent } from './shouldStripDirectiveIndent'

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
    if (lastNewline !== -1)
      lineStart = output.length - (token.value.length - lastNewline - 1)
  }
  return output
}
