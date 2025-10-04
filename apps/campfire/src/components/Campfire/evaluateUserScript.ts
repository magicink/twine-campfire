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
  const script = doc.createElement('script')
  script.type = el?.type || 'text/javascript'
  script.textContent = code
  const host = doc.head || doc.body || doc.documentElement
  if (!host) return
  host.append(script)
  script.remove()
}
