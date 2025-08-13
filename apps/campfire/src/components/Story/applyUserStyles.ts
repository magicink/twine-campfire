/**
 * Applies user-defined CSS styles from a <style> element with the ID 'twine-user-stylesheet' inside a 'tw-storydata' container
 * to the document's <head>. If the style element does not exist in <head>, it will be created.
 *
 * @param {Document | undefined} doc - The document to apply styles to. Defaults to the global document if available.
 */
export const applyUserStyles = (
  doc: Document | undefined = typeof document === 'undefined'
    ? undefined
    : document
) => {
  if (!doc || typeof doc.querySelector !== 'function') return
  const container = doc.querySelector('tw-storydata')
  const el = container?.querySelector(
    '#twine-user-stylesheet'
  ) as HTMLStyleElement | null
  const styles = el?.textContent
  if (!styles || !doc.head) return
  let styleEl = doc.head.querySelector(
    'style[data-twine-user-stylesheet]'
  ) as HTMLStyleElement | null
  if (!styleEl) {
    styleEl = doc.createElement('style')
    styleEl.setAttribute('data-twine-user-stylesheet', '')
    doc.head.appendChild(styleEl)
  }
  styleEl.textContent = styles
}
