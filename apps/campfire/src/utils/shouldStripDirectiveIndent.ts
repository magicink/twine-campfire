/**
 * Determines whether leading whitespace before a directive should be removed.
 * Tabs always qualify; spaces must be four or more with no tabs mixed in.
 *
 * @param indent - Leading whitespace characters.
 * @returns True if the indent should be stripped.
 */
export const shouldStripDirectiveIndent = (indent: string): boolean => {
  if (!indent) return false
  let tabs = true
  let spaces = true
  for (const ch of indent) {
    if (ch !== '\t') tabs = false
    if (ch !== ' ') spaces = false
  }
  return tabs || (spaces && indent.length >= 4)
}
