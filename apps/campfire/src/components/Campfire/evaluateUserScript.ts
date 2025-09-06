/**
 * Executes the contents of the <code>#twine-user-script</code> element.
 *
 * @warning This will run arbitrary JavaScript using the <code>Function</code>
 * constructor in the global scope. Only use this with trusted content.
 */
export const evaluateUserScript = (
  doc: Document | undefined = globalThis.document
) => {
  if (!doc?.getElementById) return
  const el = doc.getElementById('twine-user-script') as HTMLScriptElement | null
  const code = el?.textContent
  if (!code) return
  // Using the Function constructor executes the code in the global scope.
  // eslint-disable-next-line no-new-func
  const fn = new Function(code)
  fn()
}
