import {
  CompletionItem,
  CompletionItemKind,
  Diagnostic,
  DiagnosticCollection,
  DiagnosticSeverity,
  ExtensionContext,
  MarkdownString,
  Position,
  Range,
  SnippetString,
  TextDocument,
  commands,
  languages,
  window,
  workspace
} from 'vscode'
import { randomUUID } from 'crypto'

/**
 * A descriptor for Twee 3 snippets that can be surfaced as IntelliSense completions.
 */
interface DirectiveSnippet {
  /** The marker prefix to use when inserting the snippet (":" / "::" / ":::"). */
  marker: string
  /** The label that appears in the completion list. */
  label: string
  /** Optional override for the rendered completion label. */
  completionLabel?: string
  /** A short detail string displayed next to the completion item. */
  detail: string
  /** Markdown documentation describing how to use the directive. */
  documentation: string
  /** The snippet body inserted when the completion is accepted. */
  body: string
}

const directiveSnippets: DirectiveSnippet[] = [
  {
    marker: '::',
    label: 'passage',
    completionLabel: ':: Passage header',
    detail: 'Define a Twee 3 passage',
    documentation:
      'Creates a Twee 3 passage heading. Add optional tags or metadata after the passage name as needed.',
    body: ':: ${1:Passage Name}${2}${3}\n$0'
  },
  {
    marker: '::',
    label: 'StoryTitle',
    detail: 'Set the Twee 3 story title',
    documentation:
      'Populates the StoryTitle special passage used by Twee 3 to name the story.',
    body: ':: StoryTitle\n${1:Story Title}\n$0'
  },
  {
    marker: '::',
    label: 'StoryMenu',
    detail: 'Customize the Twee 3 story menu',
    documentation:
      'Defines the StoryMenu special passage used to populate the menu shown in Twine.',
    body: ':: StoryMenu\n$0'
  },
  {
    marker: '::',
    label: 'StoryCaption',
    detail: 'Set the Twee 3 story caption',
    documentation:
      'Creates a StoryCaption special passage for additional byline or credit text.',
    body: ':: StoryCaption\n$0'
  },
  {
    marker: '::',
    label: 'StoryAuthor',
    detail: 'Identify the story author',
    documentation:
      'Populates the StoryAuthor special passage with author attribution.',
    body: ':: StoryAuthor\n${1:Author Name}\n$0'
  },
  {
    marker: '::',
    label: 'StorySubtitle',
    detail: 'Set the Twee 3 story subtitle',
    documentation:
      'Adds a StorySubtitle passage for supplemental story titling.',
    body: ':: StorySubtitle\n${1:An interactive tale}\n$0'
  },
  {
    marker: '::',
    label: 'StoryIncludes',
    detail: 'Reference external Twine Story (.tws) resources',
    documentation:
      'Lists additional Twine Story (.tws) resources that Twine should merge when building the story. Only .tws files are supported.',
    body: ':: StoryIncludes\n${1:localfile.tws}\n$0'
  },
  {
    marker: '::',
    label: 'UserStylesheet',
    completionLabel: ':: UserStylesheet[stylesheet]',
    detail: 'Add global story styles',
    documentation:
      'Provides CSS that Twine injects into every passage when rendering the story.',
    body: ':: UserStylesheet[stylesheet]\n$0'
  },
  {
    marker: '::',
    label: 'UserScript',
    completionLabel: ':: UserScript[script]',
    detail: 'Add global story scripts',
    documentation:
      'Declares JavaScript that Twine runs once when the story loads.',
    body: ':: UserScript[script]\n$0'
  },
  {
    marker: '::',
    label: 'StorySettings',
    detail: 'Configure Twee 3 story options',
    documentation:
      'Declares a StorySettings passage where you can opt into supported toggles such as undo, bookmarking, and script loading.',
    body: [':: StorySettings', '$0'].join('\n')
  },
  {
    marker: '::',
    label: 'StoryData',
    detail: 'Provide Twee 3 story metadata',
    documentation:
      'Begins a StoryData passage so you can configure IFID, story format, and other metadata in JSON.',
    body: ':: StoryData\n$0'
  }
]

/**
 * Build a VS Code completion item from a directive snippet definition.
 *
 * @param snippet - The Twee 3 snippet to transform into a completion item.
 * @param range - The document range that should be replaced when the snippet is inserted.
 * @returns A fully configured completion item for the IntelliSense list.
 */
const createCompletionItem = (
  snippet: DirectiveSnippet,
  range: Range
): CompletionItem => {
  const item = new CompletionItem(
    snippet.completionLabel ?? `${snippet.marker}${snippet.label}`,
    CompletionItemKind.Snippet
  )
  item.insertText = new SnippetString(snippet.body)
  item.detail = snippet.detail
  item.documentation = new MarkdownString(snippet.documentation)
  item.range = range
  item.filterText = `${snippet.marker}${snippet.label}`
  return item
}

/**
 * Completion details for StoryData JSON properties.
 */
const storyDataProperties = [
  {
    label: '"ifid"',
    detail: 'StoryData property',
    documentation: "Sets the story's IFID (Interactive Fiction ID).",
    body: '"ifid": "${1}"'
  },
  {
    label: '"format"',
    detail: 'StoryData property',
    documentation: 'Names the story format used to render the project.',
    body: '"format": "${1:SugarCube}"'
  },
  {
    label: '"format-version"',
    detail: 'StoryData property',
    documentation: 'Specifies the version of the selected story format.',
    body: '"format-version": "${1:2.28.2}"'
  },
  {
    label: '"start"',
    detail: 'StoryData property',
    documentation: 'Identifies the default starting passage.',
    body: '"start": "${1:My Starting Passage}"'
  },
  {
    label: '"tag-colors"',
    detail: 'StoryData property',
    documentation: 'Maps passage tags to colors for the Twine UI.',
    body: ['"tag-colors": {', '  "${1:tag}": "${2:color}"', '}'].join('\n')
  },
  {
    label: '"zoom"',
    detail: 'StoryData property',
    documentation: 'Controls the initial zoom level of the story map.',
    body: '"zoom": ${1:0.25}'
  }
]

/**
 * Completion details for StorySettings options.
 */
const storySettingsOptions = [
  {
    label: 'undo',
    detail: 'StorySettings option',
    documentation: 'Toggle undo support for the story. Accepts `on` or `off`.',
    body: 'undo:${1:value}'
  },
  {
    label: 'bookmark',
    detail: 'StorySettings option',
    documentation:
      'Enable or disable bookmarking support. Accepts `on` or `off`.',
    body: 'bookmark:${1:value}'
  },
  {
    label: 'hash',
    detail: 'StorySettings option',
    documentation: 'Control hash-based navigation. Accepts `on` or `off`.',
    body: 'hash:${1:value}'
  },
  {
    label: 'exitprompt',
    detail: 'StorySettings option',
    documentation:
      'Request confirmation before leaving the story. Accepts `on` or `off`.',
    body: 'exitprompt:${1:value}'
  },
  {
    label: 'blankcss',
    detail: 'StorySettings option',
    documentation:
      "Remove Twine's default StorySettings stylesheet. Accepts `on` or `off`.",
    body: 'blankcss:${1:value}'
  },
  {
    label: 'obfuscate',
    detail: 'StorySettings option',
    documentation:
      'Obfuscate the published story source using the chosen method. Accepts `off`, `none`, `spaces`, or `rot13`.',
    body: 'obfuscate:${1:value}'
  },
  {
    label: 'jquery',
    detail: 'StorySettings option',
    documentation: 'Load jQuery for the story. Accepts `on` or `off`.',
    body: 'jquery:${1:value}'
  },
  {
    label: 'modernizr',
    detail: 'StorySettings option',
    documentation: 'Load Modernizr for the story. Accepts `on` or `off`.',
    body: 'modernizr:${1:value}'
  }
]

/**
 * Supported StorySettings toggles and their allowed values.
 */
const storySettingsRules: Record<string, string[]> = {
  undo: ['on', 'off'],
  bookmark: ['on', 'off'],
  hash: ['on', 'off'],
  exitprompt: ['on', 'off'],
  blankcss: ['on', 'off'],
  obfuscate: ['off', 'none', 'spaces', 'rot13'],
  jquery: ['on', 'off'],
  modernizr: ['on', 'off']
}

/**
 * Describe the contiguous body lines that belong to a StoryData passage.
 */
interface StoryDataBlock {
  /** The line number containing the StoryData header. */
  headerLine: number
  /** The first line of the StoryData body following the header. */
  startLine: number
  /** One line after the final StoryData body line. */
  endLine: number
}

const storyDataPassagePattern = /^::\s+StoryData\b/
const passageHeadingPattern = /^::\s+[A-Za-z_][A-Za-z0-9_]*/
const storyDataIfidPattern = /"ifid"\s*:\s*("[^"]*"|[^\s,}]+)/

/**
 * Gather StoryData passages within the provided document.
 *
 * @param document - The Twee 3 document to scan.
 * @returns A collection of StoryData blocks describing each passage body.
 */
const collectStoryDataBlocks = (document: TextDocument): StoryDataBlock[] => {
  const blocks: StoryDataBlock[] = []

  for (let lineNumber = 0; lineNumber < document.lineCount; lineNumber += 1) {
    const line = document.lineAt(lineNumber)
    if (!storyDataPassagePattern.test(line.text)) {
      continue
    }

    const startLine = lineNumber + 1
    let probe = startLine

    while (probe < document.lineCount) {
      const probeLine = document.lineAt(probe)
      if (passageHeadingPattern.test(probeLine.text)) {
        break
      }
      probe += 1
    }

    blocks.push({ headerLine: lineNumber, startLine, endLine: probe })
    lineNumber = probe - 1
  }

  return blocks
}

/**
 * Resolve the document range that spans the body of a StoryData passage.
 *
 * @param document - The Twee 3 document under inspection.
 * @param block - The StoryData block describing the passage.
 * @returns A range covering the passage body.
 */
const resolveStoryDataBodyRange = (
  document: TextDocument,
  block: StoryDataBlock
): Range => {
  if (block.startLine >= block.endLine) {
    const position = new Position(block.startLine, 0)
    return new Range(position, position)
  }

  const endLine = block.endLine - 1
  const endCharacter = document.lineAt(endLine).text.length
  return new Range(block.startLine, 0, endLine, endCharacter)
}

/**
 * Locate the IFID key and value ranges within a StoryData passage.
 *
 * @param document - The Twee 3 document containing the passage.
 * @param block - The StoryData block to inspect.
 * @returns The ranges that cover the IFID key and value, if present.
 */
const locateIfidToken = (
  document: TextDocument,
  block: StoryDataBlock
): { keyRange: Range; valueRange: Range } | undefined => {
  for (let line = block.startLine; line < block.endLine; line += 1) {
    const textLine = document.lineAt(line)
    const match = storyDataIfidPattern.exec(textLine.text)
    if (!match) {
      continue
    }

    const keyIndex = textLine.text.indexOf('"ifid"', match.index)
    const value = match[1]
    const valueStart = textLine.text.indexOf(value, match.index)

    return {
      keyRange: new Range(line, keyIndex, line, keyIndex + '"ifid"'.length),
      valueRange: new Range(line, valueStart, line, valueStart + value.length)
    }
  }

  return undefined
}

/**
 * Determine whether the provided value is a valid UUID string.
 *
 * @param value - The IFID value extracted from StoryData.
 * @returns True when the value conforms to the UUID format.
 */
const isUuid = (value: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  )
}

/**
 * Diagnose StorySettings entries and surface issues via VS Code diagnostics.
 *
 * @param document - The Twee 3 document to validate.
 * @param collection - The diagnostic collection to populate with detected issues.
 */
const validateStorySettingsPassages = (
  document: TextDocument,
  collection: DiagnosticCollection
): void => {
  if (document.languageId !== 'twee3') {
    collection.delete(document.uri)
    return
  }

  const diagnostics: Diagnostic[] = []
  const passagePattern = /^::\s+StorySettings\b/
  const settingPattern = /^(\s*)([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(\S.*)$/

  for (let lineNumber = 0; lineNumber < document.lineCount; lineNumber += 1) {
    const line = document.lineAt(lineNumber)
    if (!passagePattern.test(line.text)) {
      continue
    }

    let probe = lineNumber + 1
    while (probe < document.lineCount) {
      const settingLine = document.lineAt(probe)
      if (/^::\s+[A-Za-z_][A-Za-z0-9_]*/.test(settingLine.text)) {
        break
      }

      const trimmed = settingLine.text.trim()
      if (trimmed.length > 0) {
        const match = settingPattern.exec(settingLine.text)
        if (!match) {
          diagnostics.push(
            new Diagnostic(
              settingLine.range,
              'StorySettings entries must use the "setting:value" format.',
              DiagnosticSeverity.Error
            )
          )
        } else {
          const [, leadingWhitespace, name, value] = match
          const normalizedName = name.toLowerCase()
          const normalizedValue = value.toLowerCase()
          const nameStart = leadingWhitespace.length
          const nameRange = new Range(
            probe,
            nameStart,
            probe,
            nameStart + name.length
          )

          if (!(normalizedName in storySettingsRules)) {
            diagnostics.push(
              new Diagnostic(
                nameRange,
                `Unknown StorySettings option "${name}".`,
                DiagnosticSeverity.Error
              )
            )
          } else {
            const allowedValues = storySettingsRules[normalizedName]
            const rawValueStart = settingLine.text.indexOf(
              value,
              nameStart + name.length
            )
            const valueStart =
              rawValueStart === -1
                ? settingLine.text.length - value.length
                : rawValueStart
            const valueRange = new Range(
              probe,
              valueStart,
              probe,
              valueStart + value.length
            )

            if (!allowedValues.includes(normalizedValue)) {
              diagnostics.push(
                new Diagnostic(
                  valueRange,
                  `Invalid value "${value}" for ${name}. Expected one of: ${allowedValues.join(', ')}.`,
                  DiagnosticSeverity.Error
                )
              )
            }
          }
        }
      }

      probe += 1
    }
    lineNumber = probe - 1
  }

  collection.set(document.uri, diagnostics)
}

/**
 * Diagnose StoryData passages to ensure they include a valid IFID.
 *
 * @param document - The Twee 3 document to validate.
 * @param collection - The diagnostic collection to populate with StoryData issues.
 */
const validateStoryDataPassages = (
  document: TextDocument,
  collection: DiagnosticCollection
): void => {
  if (document.languageId !== 'twee3') {
    collection.delete(document.uri)
    return
  }

  const diagnostics: Diagnostic[] = []
  const blocks = collectStoryDataBlocks(document)

  blocks.forEach(block => {
    const bodyRange = resolveStoryDataBodyRange(document, block)
    const bodyText = document.getText(bodyRange)
    const trimmedBody = bodyText.trim()
    const headerRange = document.lineAt(block.headerLine).range

    if (trimmedBody.length === 0) {
      diagnostics.push(
        new Diagnostic(
          headerRange,
          'StoryData must include JSON with an "ifid" property.',
          DiagnosticSeverity.Error
        )
      )
      return
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(bodyText)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to parse StoryData JSON.'
      const range = bodyRange.isEmpty ? headerRange : bodyRange

      diagnostics.push(
        new Diagnostic(
          range,
          `StoryData JSON could not be parsed: ${message}`,
          DiagnosticSeverity.Error
        )
      )
      return
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      const range = bodyRange.isEmpty ? headerRange : bodyRange
      diagnostics.push(
        new Diagnostic(
          range,
          'StoryData must be a JSON object that defines an "ifid" string.',
          DiagnosticSeverity.Error
        )
      )
      return
    }

    const token = locateIfidToken(document, block)
    const diagnosticRange =
      token?.valueRange ??
      token?.keyRange ??
      (bodyRange.isEmpty ? headerRange : bodyRange)
    const data = parsed as Record<string, unknown>
    const ifid = data.ifid

    if (typeof ifid !== 'string' || ifid.trim().length === 0) {
      diagnostics.push(
        new Diagnostic(
          diagnosticRange,
          'StoryData must define a non-empty "ifid" string.',
          DiagnosticSeverity.Error
        )
      )
      return
    }

    if (!isUuid(ifid)) {
      diagnostics.push(
        new Diagnostic(
          diagnosticRange,
          `StoryData "ifid" must be a valid UUID (received "${ifid}").`,
          DiagnosticSeverity.Error
        )
      )
    }
  })

  collection.set(document.uri, diagnostics)
}

/**
 * Describe the Twee 3 passage that surrounds the current position, if any.
 */
const resolvePassageContext = (
  document: TextDocument,
  position: Position
): { name: string; line: number } | undefined => {
  for (let lineNumber = position.line; lineNumber >= 0; lineNumber -= 1) {
    const line = document.lineAt(lineNumber)
    // Match passage names beginning with a letter or underscore followed by word characters.
    const match = line.text.match(/^::\s+([A-Za-z_][A-Za-z0-9_]*)/)
    if (match) {
      return { name: match[1], line: lineNumber }
    }
  }

  return undefined
}

/**
 * Determine the replacement range for property completions.
 */
const resolvePropertyRange = (
  document: TextDocument,
  position: Position
): Range => {
  return (
    document.getWordRangeAtPosition(position, /"?[A-Za-z-]+"?/) ??
    new Range(position, position)
  )
}

/**
 * Create a completion item for StoryData or StorySettings properties.
 */
const createPropertyCompletion = (
  body: string,
  label: string,
  detail: string,
  documentation: string,
  range: Range
): CompletionItem => {
  const item = new CompletionItem(label, CompletionItemKind.Property)
  item.insertText = new SnippetString(body)
  item.detail = detail
  item.documentation = new MarkdownString(documentation)
  item.range = range
  return item
}

/**
 * Determine the colon run that triggered completion so IntelliSense can replace it cleanly.
 *
 * @param document - The active text document.
 * @param position - The cursor position where completion was requested.
 * @returns A range spanning the contiguous colon characters preceding the cursor.
 */
const resolveReplacementRange = (
  document: TextDocument,
  position: Position
): Range => {
  let start = position
  let colonCount = 0

  while (start.character > 0 && colonCount < 3) {
    const probe = new Range(start.translate(0, -1), start)
    if (document.getText(probe) === ':') {
      start = start.translate(0, -1)
      colonCount += 1
      continue
    }
    break
  }

  return new Range(start, position)
}

/**
 * Register Twee 3 language features when the extension activates.
 *
 * @param context - VS Code extension context provided on activation.
 */
export function activate(context: ExtensionContext): void {
  const storySettingsDiagnostics = languages.createDiagnosticCollection(
    'twee3-storysettings'
  )
  const storyDataDiagnostics =
    languages.createDiagnosticCollection('twee3-storydata')

  const provider = languages.registerCompletionItemProvider(
    { language: 'twee3' },
    {
      /**
       * Provide colon-triggered directive completions for Twee 3.
       */
      provideCompletionItems(document: TextDocument, position: Position) {
        const range = resolveReplacementRange(document, position)
        return directiveSnippets.map(snippet =>
          createCompletionItem(snippet, range)
        )
      }
    },
    ':'
  )

  const propertyProvider = languages.registerCompletionItemProvider(
    { language: 'twee3' },
    {
      /**
       * Surface completions for StoryData JSON keys and StorySettings toggles.
       */
      provideCompletionItems(document: TextDocument, position: Position) {
        const context = resolvePassageContext(document, position)
        if (!context) {
          return undefined
        }

        if (position.line === context.line) {
          return undefined
        }

        const range = resolvePropertyRange(document, position)

        if (context.name === 'StoryData') {
          return storyDataProperties.map(property =>
            createPropertyCompletion(
              property.body,
              property.label,
              property.detail,
              property.documentation,
              range
            )
          )
        }

        if (context.name === 'StorySettings') {
          return storySettingsOptions.map(option =>
            createPropertyCompletion(
              option.body,
              option.label,
              option.detail,
              option.documentation,
              range
            )
          )
        }

        return undefined
      }
    },
    '"'
  )

  const generateIfidCommand = commands.registerCommand(
    'twee3.generateIfid',
    async () => {
      const editor = window.activeTextEditor
      if (!editor || editor.document.languageId !== 'twee3') {
        window.showErrorMessage('Open a Twee 3 document to generate an IFID.')
        return
      }

      const blocks = collectStoryDataBlocks(editor.document)
      if (blocks.length === 0) {
        window.showErrorMessage(
          'Add a :: StoryData passage before generating an IFID.'
        )
        return
      }

      const context = resolvePassageContext(
        editor.document,
        editor.selection.active
      )
      const block =
        (context?.name === 'StoryData'
          ? blocks.find(candidate => candidate.headerLine === context.line)
          : undefined) ?? blocks[0]

      const newIfid = randomUUID().toUpperCase()
      const bodyRange = resolveStoryDataBodyRange(editor.document, block)
      const rawBody = editor.document.getText(bodyRange)
      const existingToken = locateIfidToken(editor.document, block)

      if (existingToken) {
        const applied = await editor.edit(editBuilder => {
          editBuilder.replace(existingToken.valueRange, `"${newIfid}"`)
        })
        if (!applied) {
          window.showErrorMessage('Unable to update the StoryData IFID.')
          return
        }

        window.showInformationMessage(`Generated IFID ${newIfid}.`)
        return
      }

      const trimmedBody = rawBody.trim()
      let replacementText: string

      if (trimmedBody.length === 0) {
        replacementText = JSON.stringify({ ifid: newIfid }, null, 2)
      } else {
        let parsed: unknown
        try {
          parsed = JSON.parse(rawBody)
        } catch (error) {
          window.showErrorMessage(
            'Fix the StoryData JSON before generating an IFID.'
          )
          return
        }

        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          Array.isArray(parsed)
        ) {
          window.showErrorMessage(
            'StoryData must be a JSON object before an IFID can be generated.'
          )
          return
        }

        const entries = Object.entries(parsed as Record<string, unknown>)
        const updatedEntries: [string, unknown][] = []
        let replaced = false

        entries.forEach(([key, value]) => {
          if (key === 'ifid') {
            updatedEntries.push(['ifid', newIfid])
            replaced = true
          } else {
            updatedEntries.push([key, value])
          }
        })

        if (!replaced) {
          updatedEntries.unshift(['ifid', newIfid])
        }

        const updatedObject = updatedEntries.reduce<Record<string, unknown>>(
          (accumulator, [key, value]) => {
            accumulator[key] = value
            return accumulator
          },
          {}
        )

        replacementText = JSON.stringify(updatedObject, null, 2)
      }

      const applied = await editor.edit(editBuilder => {
        editBuilder.replace(bodyRange, replacementText)
      })

      if (!applied) {
        window.showErrorMessage('Unable to insert the generated IFID.')
        return
      }

      window.showInformationMessage(`Generated IFID ${newIfid}.`)
    }
  )

  /**
   * Re-run StoryData and StorySettings validation for the provided document.
   *
   * @param document - The document to scan for Twee 3 issues.
   */
  const handleDocument = (document: TextDocument): void => {
    validateStoryDataPassages(document, storyDataDiagnostics)
    validateStorySettingsPassages(document, storySettingsDiagnostics)
  }

  workspace.textDocuments.forEach(handleDocument)

  context.subscriptions.push(
    storySettingsDiagnostics,
    storyDataDiagnostics,
    provider,
    propertyProvider,
    generateIfidCommand,
    workspace.onDidOpenTextDocument(handleDocument),
    workspace.onDidChangeTextDocument(event => handleDocument(event.document)),
    workspace.onDidCloseTextDocument(document =>
      [storySettingsDiagnostics, storyDataDiagnostics].forEach(collection =>
        collection.delete(document.uri)
      )
    )
  )
}

/**
 * Clean up any resources when the extension is deactivated.
 */
export function deactivate(): void {
  // No resources to dispose of because subscriptions are managed by VS Code.
}
