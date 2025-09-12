/**
 * Token emitted by {@link scanDirectives}.
 */
export interface DirectiveToken {
  /** The token classification. */
  type: 'text' | 'leaf' | 'container'
  /** Raw token value. */
  value: string
}

/**
 * Yields tokens for text and Campfire directives from a source string.
 * Walks the input once, classifying directives beginning with `:`, `::`, or
 * `:::`. Label `[]` and attribute `{}` segments are skipped, including
 * mismatched braces.
 *
 * @param source - Raw string to scan.
 */
export const scanDirectives = function* (
  source: string
): Generator<DirectiveToken> {
  const length = source.length
  let index = 0
  let last = 0
  let lineStart = 0

  const isDirectiveStart = (pos: number): boolean => {
    for (let i = lineStart; i < pos; i++) {
      const c = source[i]
      if (c !== ' ' && c !== '\t') return false
    }
    let count = 0
    while (pos + count < length && source[pos + count] === ':') {
      count++
      if (count > 3) return false
    }
    return count > 0
  }

  const readDirective = (
    pos: number
  ): { end: number; type: 'leaf' | 'container' } => {
    let i = pos
    let count = 0
    while (i < length && source[i] === ':' && count < 3) {
      i++
      count++
    }
    const type = count === 3 ? 'container' : 'leaf'
    while (i < length) {
      const c = source[i]
      if (c === '[' || c === '{' || c === '\n') break
      i++
    }
    if (source[i] === '[') {
      i++
      let depth = 1
      while (i < length && depth > 0) {
        const c = source[i]
        if (c === '\\') {
          i++
          if (i < length) i++
          continue
        }
        if (c === '[') depth++
        else if (c === ']') depth--
        else if (c === '\n') break
        i++
      }
      if (source[i] === ']') i++
    }
    if (source[i] === '{') {
      i++
      let depth = 1
      while (i < length && depth > 0) {
        const c = source[i]
        if (c === '\\') {
          i++
          if (i < length) i++
          continue
        }
        if (c === '{') depth++
        else if (c === '}') depth--
        else if (c === '\n') break
        i++
      }
      if (source[i] === '}') i++
    }
    return { end: i, type }
  }

  while (index < length) {
    if (source[index] === ':' && isDirectiveStart(index)) {
      if (last < index) {
        yield { type: 'text', value: source.slice(last, index) }
        last = index
      }
      const { end, type } = readDirective(index)
      yield { type, value: source.slice(index, end) }
      index = end
      last = end
      continue
    }
    if (source[index] === '\n') {
      index++
      lineStart = index
    } else {
      index++
    }
  }
  if (last < length) {
    yield { type: 'text', value: source.slice(last) }
  }
}
