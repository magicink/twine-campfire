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
    detail: 'Define a Campfire passage',
    documentation:
      'Creates a Campfire passage heading. Add optional tags or metadata after the passage name as needed.',
    body: ':: ${1:Passage Name}${2}${3}\n$0'
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

  context.subscriptions.push(provider)
}

/**
 * Clean up any resources when the extension is deactivated.
 */
export function deactivate(): void {
  // No resources to dispose of because subscriptions are managed by VS Code.
}
