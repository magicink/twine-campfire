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
  languages,
  workspace
} from 'vscode'

/**
 * A descriptor for Campfire directive snippets that can be surfaced as IntelliSense completions.
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
    body: ':: ${1:Passage Name}${2}${3}\\n$0'
  },
  {
    marker: '::',
    label: 'StoryTitle',
    detail: 'Set the Twee 3 story title',
    documentation:
      'Populates the StoryTitle special passage used by Twee 3 to name the story.',
    body: ':: StoryTitle\\n${1:Campfire Story}\\n$0'
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
  },
  {
    marker: '::',
    label: 'set',
    detail: 'Assign a story variable',
    documentation:
      'Updates one or more state keys to the provided values. Separate multiple assignments with spaces.',
    body: '::set[${1:key}=${2:value}]'
  },
  {
    marker: '::',
    label: 'setOnce',
    detail: 'Assign a story variable only once',
    documentation:
      'Sets the provided state key the first time it runs and leaves the existing value untouched afterwards.',
    body: '::setOnce[${1:key}=${2:value}]'
  },
  {
    marker: '::',
    label: 'range',
    completionLabel: ':: createRange',
    detail: 'Create a numeric range',
    documentation:
      'Initializes a numeric range with starting, minimum, and maximum values. Update it later with `::setRange`.',
    body: '::createRange[${1:key}=${2:value}]{min=${3:min} max=${4:max}}'
  },
  {
    marker: '::',
    label: 'array',
    detail: 'Create an array in story state',
    documentation:
      'Initializes an array stored under the provided key. Items can be literal values or expressions.',
    body: '::array[${1:key}=[${2:items}]]'
  },
  {
    marker: '::',
    label: 'arrayOnce',
    detail: 'Create an array only if unset',
    documentation:
      'Like `::array`, but skips initialization when the key already exists.',
    body: '::arrayOnce[${1:key}=[${2:items}]]'
  },
  {
    marker: ':',
    label: 'random',
    detail: 'Select a random value',
    documentation: 'Assigns a random option to a state key.',
    body: ':random ${1:key} ${2:choiceA} ${3:choiceB}'
  },
  {
    marker: ':',
    label: 'input',
    detail: 'Collect input from the reader',
    documentation: 'Creates an inline input element bound to story state.',
    body: ':input name="${1:key}" label="${2:Prompt}"'
  },
  {
    marker: ':',
    label: 'show',
    detail: 'Display a value from story state',
    documentation:
      'Renders the evaluated expression or state key in the passage output.',
    body: ':show[${1:expression}]'
  },
  {
    marker: '::',
    label: 'if',
    detail: 'Conditional block',
    documentation:
      'Wraps content that only renders when the condition is truthy.',
    body: '::if ${1:condition}\n\t$0\n:::'
  },
  {
    marker: '::',
    label: 'else',
    detail: 'Else block',
    documentation: 'Extends a prior `if` with fallback content.',
    body: '::else\n\t$0\n:::'
  },
  {
    marker: '::',
    label: 'slide',
    detail: 'Slide within a deck',
    documentation:
      'Defines a single slide that appears within the surrounding deck.',
    body: '::slide ${1:label}\n\t$0'
  },
  {
    marker: '::',
    label: 'trigger',
    detail: 'Event trigger',
    documentation:
      'Creates an interactive trigger that defers execution until activated.',
    body: '::trigger ${1:label}\n\t$0\n:::'
  },
  {
    marker: '::',
    label: 'select',
    detail: 'Selection list',
    documentation: 'Presents a list of options the reader can choose from.',
    body: '::select ${1:key}\n\t:option value="${2:value}" label="${3:Label}"\n:::'
  },
  {
    marker: ':::',
    label: 'deck',
    detail: 'Slide deck container',
    documentation: 'Groups multiple slides with navigation controls.',
    body: ':::deck ${1:label}\n::slide ${2:label}\n\t$3\n::slide ${4:label}\n\t$5\n:::'
  },
  {
    marker: ':::',
    label: 'layer',
    detail: 'Layer container',
    documentation:
      'Renders layered content that can be toggled via directives.',
    body: ':::layer ${1:label}\n\t$0\n:::'
  },
  {
    marker: ':::',
    label: 'text',
    detail: 'Positioned text block',
    documentation:
      'Places formatted text on a layer or deck slide. Configure position and styling attributes as needed.',
    body: ':::text{${1:attributes}}\n\t$0\n:::'
  }
]

/**
 * Build a VS Code completion item from a directive snippet definition.
 *
 * @param snippet - The Campfire directive snippet to transform into a completion item.
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
    body: '"ifid": "${1:D674C58C-DEFA-4F70-B7A2-27742230C0FC}"'
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
 * Diagnose StorySettings entries and surface issues via VS Code diagnostics.
 *
 * @param document - The Campfire document to validate.
 * @param collection - The diagnostic collection to populate with detected issues.
 */
const validateStorySettingsPassages = (
  document: TextDocument,
  collection: DiagnosticCollection
): void => {
  if (document.languageId !== 'campfire') {
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
 * Register Campfire language features when the extension activates.
 *
 * @param context - VS Code extension context provided on activation.
 */
export function activate(context: ExtensionContext): void {
  const storySettingsDiagnostics = languages.createDiagnosticCollection(
    'campfire-storysettings'
  )

  const provider = languages.registerCompletionItemProvider(
    { language: 'campfire' },
    {
      /**
       * Provide colon-triggered directive completions for Campfire.
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
    { language: 'campfire' },
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

  /**
   * Re-run StorySettings validation for the provided document.
   *
   * @param document - The document to scan for StorySettings issues.
   */
  const handleDocument = (document: TextDocument): void => {
    validateStorySettingsPassages(document, storySettingsDiagnostics)
  }

  workspace.textDocuments.forEach(handleDocument)

  context.subscriptions.push(
    storySettingsDiagnostics,
    provider,
    propertyProvider,
    workspace.onDidOpenTextDocument(handleDocument),
    workspace.onDidChangeTextDocument(event => handleDocument(event.document)),
    workspace.onDidCloseTextDocument(document =>
      storySettingsDiagnostics.delete(document.uri)
    )
  )
}

/**
 * Clean up any resources when the extension is deactivated.
 */
export function deactivate(): void {
  // No resources to dispose of because subscriptions are managed by VS Code.
}
