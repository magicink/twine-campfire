import {
  CompletionItem,
  CompletionItemKind,
  ExtensionContext,
  MarkdownString,
  Position,
  Range,
  SnippetString,
  TextDocument,
  languages
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
      'Creates a Twee 3 passage heading with optional tags and metadata. Delete the tag or metadata placeholders if you do not need them.',
    body: ':: ${1:Passage Name}${2: [tags]}${3: {"position":"600,400","size":"100,200"}}\\n$0'
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
      'Declares a StorySettings passage listing all supported toggles such as undo, hash navigation, and script loading.',
    body: [
      ':: StorySettings',
      'undo:${1:on}',
      'bookmark:${2:on}',
      'hash:${3:on}',
      'exitprompt:${4:on}',
      'blankcss:${5:on}',
      'obfuscate:${6:rot13}',
      'jquery:${7:on}',
      'modernizr:${8:on}',
      '$0'
    ].join('\n')
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
    marker: ':',
    label: 'set',
    detail: 'Assign a story variable',
    documentation: 'Updates a state key to the provided value.',
    body: ':set ${1:key}=${2:value}'
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
    documentation: 'Toggle undo support for the story.',
    body: 'undo:${1:on}'
  },
  {
    label: 'bookmark',
    detail: 'StorySettings option',
    documentation: 'Enable or disable bookmarking support.',
    body: 'bookmark:${1:on}'
  },
  {
    label: 'hash',
    detail: 'StorySettings option',
    documentation: 'Control hash-based navigation.',
    body: 'hash:${1:on}'
  },
  {
    label: 'exitprompt',
    detail: 'StorySettings option',
    documentation: 'Request confirmation before leaving the story.',
    body: 'exitprompt:${1:on}'
  },
  {
    label: 'blankcss',
    detail: 'StorySettings option',
    documentation: "Remove Twine's default StorySettings stylesheet.",
    body: 'blankcss:${1:on}'
  },
  {
    label: 'obfuscate',
    detail: 'StorySettings option',
    documentation:
      'Obfuscate the published story source using the chosen method.',
    body: 'obfuscate:${1:rot13}'
  },
  {
    label: 'jquery',
    detail: 'StorySettings option',
    documentation: 'Load jQuery for the story.',
    body: 'jquery:${1:on}'
  },
  {
    label: 'modernizr',
    detail: 'StorySettings option',
    documentation: 'Load Modernizr for the story.',
    body: 'modernizr:${1:on}'
  }
]

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
  const range =
    document.getWordRangeAtPosition(position, /"?[A-Za-z-]+"?/) ??
    new Range(position, position)
  return range
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
export const activate = (context: ExtensionContext): void => {
  const provider = languages.registerCompletionItemProvider(
    { language: 'campfire' },
    {
      /**
       * Provide colon-triggered directive completions for Campfire.
       */
      provideCompletionItems(document, position) {
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
      provideCompletionItems(document, position) {
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

  context.subscriptions.push(provider, propertyProvider)
}

/**
 * Clean up any resources when the extension is deactivated.
 */
export const deactivate = (): void => {
  // No resources to dispose of because subscriptions are managed by VS Code.
}
