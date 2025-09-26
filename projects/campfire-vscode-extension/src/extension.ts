import {
  CompletionItem,
  CompletionItemKind,
  ExtensionContext,
  Location,
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
  /** Indicates whether the snippet should be escaped when inserted at column zero. */
  escapeAtColumnZero?: boolean
}

const directiveSnippets: DirectiveSnippet[] = [
  {
    marker: '::',
    label: 'set',
    escapeAtColumnZero: true,
    detail: 'Assign a story variable',
    documentation:
      'Updates one or more state keys to the provided values. Separate multiple assignments with spaces.',
    body: '::set[${1:key}=${2:value}]'
  },
  {
    marker: '::',
    label: 'setOnce',
    escapeAtColumnZero: true,
    detail: 'Assign a story variable only once',
    documentation:
      'Sets the provided state key the first time it runs and leaves the existing value untouched afterwards.',
    body: '::setOnce[${1:key}=${2:value}]'
  },
  {
    marker: '::',
    label: 'range',
    completionLabel: ':: createRange',
    escapeAtColumnZero: true,
    detail: 'Create a numeric range',
    documentation:
      'Initializes a numeric range with starting, minimum, and maximum values. Update it later with `::setRange`.',
    body: '::createRange[${1:key}=${2:value}]{min=${3:min} max=${4:max}}'
  },
  {
    marker: '::',
    label: 'array',
    escapeAtColumnZero: true,
    detail: 'Create an array in story state',
    documentation:
      'Initializes an array stored under the provided key. Items can be literal values or expressions.',
    body: '::array[${1:key}=[${2:items}]]'
  },
  {
    marker: '::',
    label: 'arrayOnce',
    escapeAtColumnZero: true,
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
    detail: 'Inline text input',
    documentation:
      'Creates an inline input element bound to story state with optional placeholder attributes.',
    body: ':input[${1:key}]{placeholder="${2:placeholder}"}'
  },
  {
    marker: '::',
    label: 'input',
    escapeAtColumnZero: true,
    detail: 'Leaf text input',
    documentation:
      'Creates a text input element bound to story state with optional attributes.',
    body: '::input[${1:key}]{placeholder="${2:placeholder}"}'
  },
  {
    marker: ':::',
    label: 'input',
    escapeAtColumnZero: true,
    detail: 'Container input block',
    documentation:
      'Wraps interactive input content so you can attach focus, blur, or change handlers to the field.',
    body: ':::input[${1:key}]\n  $0\n:::'
  },
  {
    marker: ':',
    label: 'textarea',
    detail: 'Inline textarea',
    documentation:
      'Creates an inline multi-line text area bound to story state.',
    body: ':textarea[${1:key}]{placeholder="${2:placeholder}"}'
  },
  {
    marker: ':',
    label: 't',
    detail: 'Inline translate',
    documentation: 'Output a translated string inline.',
    body: ':t[${1:key}]{ns="${2:ui}" fallback="${3:Fallback}"}'
  },
  {
    marker: ':::',
    label: 'textarea',
    escapeAtColumnZero: true,
    detail: 'Container textarea block',
    documentation:
      'Wraps interactive textarea content so you can attach focus, blur, or change handlers to the field.',
    body: ':::textarea[${1:key}]\n  $0\n:::'
  },
  {
    marker: ':',
    label: 'checkbox',
    detail: 'Inline checkbox',
    documentation: 'Creates an inline toggle checkbox bound to story state.',
    body: ':checkbox[${1:key}]'
  },
  {
    marker: ':::',
    label: 'checkbox',
    escapeAtColumnZero: true,
    detail: 'Container checkbox block',
    documentation:
      'Wraps interactive checkbox content so you can attach focus, blur, or change handlers to the field.',
    body: ':::checkbox[${1:key}]\n  $0\n:::'
  },
  {
    marker: ':',
    label: 'radio',
    detail: 'Inline radio button',
    documentation:
      'Creates an inline radio button bound to story state. Use multiple radios with the same key to build a group.',
    body: ':radio[${1:key}]{value="${2:value}"}'
  },
  {
    marker: ':::',
    label: 'radio',
    escapeAtColumnZero: true,
    detail: 'Container radio block',
    documentation:
      'Wraps interactive radio content so you can attach focus, blur, or change handlers to the field.',
    body: ':::radio[${1:key}]{value="${2:value}"}\n  $0\n:::'
  },
  {
    marker: ':::',
    label: 'select',
    escapeAtColumnZero: true,
    detail: 'Selection dropdown',
    documentation:
      'Presents a dropdown list of options the reader can choose from.',
    body: ':::select[${1:key}]{label="${2:Choose an option}"}\n  $0\n:::'
  },
  {
    marker: '::',
    label: 'option',
    escapeAtColumnZero: true,
    detail: 'Selection option',
    documentation: 'Defines an option within a select dropdown.',
    body: '::option{value="${1:value}" label="${2:Label}"}'
  },
  {
    marker: ':::',
    label: 'if',
    escapeAtColumnZero: true,
    detail: 'Conditional block',
    documentation:
      'Wraps content that only renders when the expression is truthy. Pair with `:::else` for fallback content.',
    body: ':::if[${1:expression}]\n  $0\n:::else\n  $2\n:::'
  },
  {
    marker: ':::',
    label: 'else',
    escapeAtColumnZero: true,
    detail: 'Else block',
    documentation: 'Extends a prior `if` container with fallback content.',
    body: ':::else\n  $0\n:::'
  },
  {
    marker: '::',
    label: 'slide',
    escapeAtColumnZero: true,
    detail: 'Slide within a deck',
    documentation:
      'Defines a single slide that appears within the surrounding deck.',
    body: '::slide ${1:label}\n  $0\n:::'
  },
  {
    marker: ':::',
    label: 'trigger',
    escapeAtColumnZero: true,
    detail: 'Event trigger',
    documentation:
      'Creates an interactive trigger that defers execution until activated.',
    body: ':::trigger{label="${1:Button text}"}\n  $0\n:::'
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
    marker: ':::',
    label: 'for',
    escapeAtColumnZero: true,
    detail: 'Iteration block',
    documentation: [
      'Iterates over arrays, ranges, or state keys to render content for each element.',
      '',
      '**Array iteration:**',
      '```md',
      ':::for[item in [1,2,3]]',
      '  Item: :show[item]',
      ':::',
      '```',
      '',
      '**Range iteration:**',
      '```md',
      '::createRange[counter=1]{min=1 max=5}',
      '',
      ':::for[num in counter]',
      '  Count: :show[num]',
      ':::',
      '```',
      '',
      '**State array iteration:**',
      '```md',
      '::array[items=["apple","banana","cherry"]]',
      '',
      ':::for[fruit in items]',
      '  Fruit: :show[fruit]',
      ':::',
      '```',
      '',
      'The variable name (e.g., `item`, `num`, `fruit`) becomes available within the loop content and can be used with `:show[]` or other directives.'
    ].join('\n'),
    body: ':::for[${1:item}${2}]\n  $0\n:::'
  },
  {
    marker: ':::',
    label: 'deck',
    escapeAtColumnZero: true,
    detail: 'Slide deck container',
    documentation: 'Groups multiple slides with navigation controls.',
    body: ':::deck\n  $0\n:::'
  },
  {
    marker: ':::',
    label: 'layer',
    escapeAtColumnZero: true,
    detail: 'Layer container',
    documentation:
      'Renders layered content that can be toggled via directives.',
    body: ':::layer ${1:label}\n  $0\n:::'
  },
  {
    marker: ':::',
    label: 'text',
    escapeAtColumnZero: true,
    detail: 'Positioned text block',
    documentation:
      'Places formatted text on a layer or deck slide. Configure position and styling attributes as needed.',
    body: ':::text{${1:attributes}}\n  $0\n:::'
  },
  {
    marker: ':::',
    label: 'onMouseEnter',
    escapeAtColumnZero: true,
    detail: 'Mouse enter event',
    documentation:
      'Fires when the element is hovered by the pointer. Use inside input, select, or trigger blocks.',
    body: ':::onMouseEnter\n  $0\n:::'
  },
  {
    marker: ':::',
    label: 'onMouseLeave',
    escapeAtColumnZero: true,
    detail: 'Mouse leave event',
    documentation:
      'Fires when the element is no longer hovered. Use inside input, select, or trigger blocks.',
    body: ':::onMouseLeave\n  $0\n:::'
  },
  {
    marker: ':::',
    label: 'onFocus',
    escapeAtColumnZero: true,
    detail: 'Focus event',
    documentation:
      'Fires when the element receives focus. Use inside input, select, or trigger blocks.',
    body: ':::onFocus\n  $0\n:::'
  },
  {
    marker: ':::',
    label: 'onBlur',
    escapeAtColumnZero: true,
    detail: 'Blur event',
    documentation:
      'Fires when the element loses focus. Use inside input, select, or trigger blocks.',
    body: ':::onBlur\n  $0\n:::'
  },
  {
    marker: ':::',
    label: 'batch',
    escapeAtColumnZero: true,
    detail: 'Apply multiple directives',
    documentation:
      'Apply multiple directives as a single update. Supports only data directives like set, array, unset, etc.',
    body: ':::batch\n  $0\n:::'
  },
  {
    marker: ':::',
    label: 'onExit',
    escapeAtColumnZero: true,
    detail: 'Passage exit event',
    documentation:
      'Run data directives once when leaving the passage. Only one onExit block allowed per passage.',
    body: ':::onExit\n  $0\n:::'
  },
  {
    marker: ':::',
    label: 'effect',
    escapeAtColumnZero: true,
    detail: 'State change watcher',
    documentation:
      'Run data directives when watched state keys change. Runs once on mount and again whenever watched keys update.',
    body: ':::effect[${1:watchedKey}]\n  $0\n:::'
  },
  {
    marker: '::',
    label: 'unset',
    escapeAtColumnZero: true,
    detail: 'Remove state key',
    documentation: 'Remove a key from state.',
    body: '::unset[${1:key}]'
  },
  {
    marker: '::',
    label: 'setRange',
    escapeAtColumnZero: true,
    detail: 'Update range value',
    documentation: 'Update the value of an existing range.',
    body: '::setRange[${1:key}=${2:value}]'
  },
  {
    marker: '::',
    label: 'concat',
    escapeAtColumnZero: true,
    detail: 'Concat arrays',
    documentation: 'Append items from one array to another.',
    body: '::concat{key=${1:target} value=${2:source}}'
  },
  {
    marker: '::',
    label: 'pop',
    escapeAtColumnZero: true,
    detail: 'Pop from array',
    documentation: 'Remove the last item from an array.',
    body: '::pop{key=${1:array} into=${2:removedItem}}'
  },
  {
    marker: '::',
    label: 'push',
    escapeAtColumnZero: true,
    detail: 'Push to array',
    documentation: 'Add items to the end of an array.',
    body: '::push{key=${1:array} value=${2:item}}'
  },
  {
    marker: '::',
    label: 'shift',
    escapeAtColumnZero: true,
    detail: 'Shift from array',
    documentation: 'Remove the first item from an array.',
    body: '::shift{key=${1:array} into=${2:removedItem}}'
  },
  {
    marker: '::',
    label: 'splice',
    escapeAtColumnZero: true,
    detail: 'Splice array',
    documentation: 'Splice array items and optionally store removed values.',
    body: '::splice{key=${1:array} index=${2:start} count=${3:count} value=${4:item} into=${5:removedItems}}'
  },
  {
    marker: '::',
    label: 'unshift',
    escapeAtColumnZero: true,
    detail: 'Unshift to array',
    documentation: 'Add items to the start of an array.',
    body: '::unshift{key=${1:array} value=${2:item}}'
  },
  {
    marker: ':::',
    label: 'switch',
    escapeAtColumnZero: true,
    detail: 'Switch block',
    documentation: 'Evaluate an expression and handle matching cases.',
    body: ':::switch[${1:expression}]\n  :::case[${2:"value"}]\n    $3\n  :::\n  :::default\n    $4\n  :::\n:::'
  },
  {
    marker: ':::',
    label: 'case',
    escapeAtColumnZero: true,
    detail: 'Case block',
    documentation: 'Content for a matching switch case.',
    body: ':::case[${1:"value"}]\n  $0\n:::'
  },
  {
    marker: ':::',
    label: 'default',
    escapeAtColumnZero: true,
    detail: 'Default case',
    documentation: 'Fallback block inside a switch.',
    body: ':::default\n  $0\n:::'
  },
  {
    marker: '::',
    label: 'goto',
    escapeAtColumnZero: true,
    detail: 'Go to passage',
    documentation: 'Jump to another passage.',
    body: '::goto["${1:Passage Name}"]'
  },
  {
    marker: '::',
    label: 'include',
    escapeAtColumnZero: true,
    detail: 'Include passage',
    documentation: 'Embed another passage.',
    body: '::include["${1:Passage Name}"]'
  },
  {
    marker: '::',
    label: 'title',
    escapeAtColumnZero: true,
    detail: 'Set title',
    documentation: 'Set the document title.',
    body: '::title["${1:Story Title}"]'
  },
  {
    marker: '::',
    label: 'allowLandscape',
    escapeAtColumnZero: true,
    detail: 'Allow landscape',
    documentation: 'Unlock landscape orientation.',
    body: '::allowLandscape'
  },
  {
    marker: ':::',
    label: 'wrapper',
    escapeAtColumnZero: true,
    detail: 'Wrapper container',
    documentation: 'Wrap content with custom styling or elements.',
    body: ':::wrapper{as="${1:div}" className="${2:className}"}\n  $0\n:::'
  },
  {
    marker: '::',
    label: 'image',
    escapeAtColumnZero: true,
    detail: 'Position image',
    documentation: 'Position an image on a slide.',
    body: '::image{src="${1:path/to/image.png}" x=${2:0} y=${3:0} w=${4:320} h=${5:180}}'
  },
  {
    marker: '::',
    label: 'preloadImage',
    escapeAtColumnZero: true,
    detail: 'Preload image',
    documentation: 'Preload an image asset.',
    body: '::preloadImage[${1:id}]{src="${2:path/to/image.png}"}'
  },
  {
    marker: '::',
    label: 'embed',
    escapeAtColumnZero: true,
    detail: 'Embed content',
    documentation: 'Embed external content within a slide.',
    body: '::embed{src="${1:https://example.com/embed}" w=${2:640} h=${3:360}}'
  },
  {
    marker: '::',
    label: 'preloadAudio',
    escapeAtColumnZero: true,
    detail: 'Preload audio',
    documentation: 'Preload an audio clip.',
    body: '::preloadAudio[${1:id}]{src="${2:path/to/audio.mp3}"}'
  },
  {
    marker: '::',
    label: 'sound',
    escapeAtColumnZero: true,
    detail: 'Play sound',
    documentation: 'Play a sound effect.',
    body: '::sound[${1:id}]{volume=${2:1} delay=${3:0} rate=${4:1}}'
  },
  {
    marker: '::',
    label: 'bgm',
    escapeAtColumnZero: true,
    detail: 'Background music',
    documentation: 'Control looping background music.',
    body: '::bgm[${1:id}]{src="${2:path/to/music.mp3}" volume=${3:0.5} loop=${4:true}}'
  },
  {
    marker: '::',
    label: 'volume',
    escapeAtColumnZero: true,
    detail: 'Set volume',
    documentation: 'Set global audio levels.',
    body: '::volume{bgm=${1:0.5} sfx=${2:0.8}}'
  },
  {
    marker: '::',
    label: 'checkpoint',
    escapeAtColumnZero: true,
    detail: 'Create checkpoint',
    documentation: 'Create a checkpoint with a label.',
    body: '::checkpoint{id="${1:checkpoint-id}" label="${2:Label}"}'
  },
  {
    marker: '::',
    label: 'clearCheckpoint',
    escapeAtColumnZero: true,
    detail: 'Clear checkpoint',
    documentation: 'Remove the stored checkpoint.',
    body: '::clearCheckpoint'
  },
  {
    marker: '::',
    label: 'loadCheckpoint',
    escapeAtColumnZero: true,
    detail: 'Load checkpoint',
    documentation: 'Load the stored checkpoint.',
    body: '::loadCheckpoint'
  },
  {
    marker: '::',
    label: 'save',
    escapeAtColumnZero: true,
    detail: 'Save game',
    documentation: 'Write the current state to local storage.',
    body: '::save{id="${1:slot-id}"}'
  },
  {
    marker: '::',
    label: 'load',
    escapeAtColumnZero: true,
    detail: 'Load game',
    documentation: 'Load state from local storage.',
    body: '::load{id="${1:slot-id}"}'
  },
  {
    marker: '::',
    label: 'clearSave',
    escapeAtColumnZero: true,
    detail: 'Clear save',
    documentation: 'Remove a saved game slot.',
    body: '::clearSave{id="${1:slot-id}"}'
  },
  {
    marker: '::',
    label: 'lang',
    escapeAtColumnZero: true,
    detail: 'Set language',
    documentation: 'Switch the active locale.',
    body: '::lang[${1:en-US}]'
  },
  {
    marker: '::',
    label: 't',
    escapeAtColumnZero: true,
    detail: 'Translate',
    documentation: 'Output a translated string.',
    body: '::t[${1:key}]{ns="${2:ui}" fallback="${3:Fallback}"}'
  },
  {
    marker: '::',
    label: 'translations',
    escapeAtColumnZero: true,
    detail: 'Define translations',
    documentation: 'Define a translation string.',
    body: '::translations[${1:locale}]{${2:namespace}:${3:key}="${4:value}"}'
  },
  {
    marker: '::',
    label: 'setLanguageLabel',
    escapeAtColumnZero: true,
    detail: 'Set language label',
    documentation: 'Provide a display label for a locale.',
    body: '::setLanguageLabel[${1:locale}="${2:Label}"]'
  },
  {
    marker: '::',
    label: 'toggleOverlay',
    escapeAtColumnZero: true,
    detail: 'Toggle overlay visibility',
    documentation: 'Toggle a single overlay on/off by name.',
    body: '::toggleOverlay["${1:overlayName}"]'
  },
  {
    marker: '::',
    label: 'showOverlay',
    escapeAtColumnZero: true,
    detail: 'Show overlay',
    documentation: 'Explicitly show an overlay by name.',
    body: '::showOverlay["${1:overlayName}"]'
  },
  {
    marker: '::',
    label: 'hideOverlay',
    escapeAtColumnZero: true,
    detail: 'Hide overlay',
    documentation: 'Explicitly hide an overlay by name.',
    body: '::hideOverlay["${1:overlayName}"]'
  },
  {
    marker: '::',
    label: 'toggleOverlayGroup',
    escapeAtColumnZero: true,
    detail: 'Toggle overlay group',
    documentation: 'Toggle an entire overlay group by name.',
    body: '::toggleOverlayGroup["${1:groupName}"]'
  },
  {
    marker: ':',
    label: 'shape',
    detail: 'Inline shape',
    documentation: 'Draw basic shapes within a slide (inline form).',
    body: ':shape{type="${1:rect}" x=${2:10} y=${3:20} w=${4:100} h=${5:50}}'
  },
  {
    marker: '::',
    label: 'shape',
    escapeAtColumnZero: true,
    detail: 'Shape element',
    documentation: 'Draw basic shapes within a slide.',
    body: '::shape{type="${1:rect}" x=${2:10} y=${3:20} w=${4:100} h=${5:50}}'
  },
  {
    marker: ':::',
    label: 'reveal',
    escapeAtColumnZero: true,
    detail: 'Step-by-step reveal',
    documentation: 'Reveal slide content step-by-step at specific deck steps.',
    body: ':::reveal{at=${1:0}}\n  $0\n:::'
  },
  {
    marker: '::',
    label: 'preset',
    escapeAtColumnZero: true,
    detail: 'Define preset',
    documentation:
      'Define reusable attribute sets that can be applied via the `from` attribute on other directives. Use the leaf `::preset{}` form—inline and container syntax are not supported.',
    body: '::preset{type="${1:deck}" name="${2:presetName}" ${3:attributes}}'
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
  const shouldEscape = snippet.escapeAtColumnZero && range.start.character === 0
  const escapeDirectiveLines = (text: string): string =>
    text
      .split('\n')
      .map(line => {
        if (line.startsWith('\\')) {
          return line
        }

        return /^:{1,3}/.test(line) ? `\\${line}` : line
      })
      .join('\n')

  const insertText = shouldEscape
    ? escapeDirectiveLines(snippet.body)
    : snippet.body
  const item = new CompletionItem(
    snippet.completionLabel ?? `${snippet.marker}${snippet.label}`,
    CompletionItemKind.Snippet
  )
  item.insertText = new SnippetString(insertText)
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
 * Result describing a section of text enclosed by matching delimiters.
 */
interface DelimitedSection {
  /** Raw text between the delimiters. */
  content: string
  /** Absolute offset where the section's content begins. */
  contentStart: number
  /** Absolute offset of the closing delimiter. */
  contentEnd: number
  /** Absolute offset immediately after the closing delimiter. */
  endIndex: number
}

/**
 * Reference to a passage within the active document.
 */
interface PassageReference {
  /** Normalized passage name targeted by the reference. */
  passage: string
  /** Range covering the clickable portion of the reference. */
  range: Range
}

/**
 * Extract a substring wrapped by the provided delimiters, accounting for nested delimiters and
 * quoted strings.
 *
 * @param text - Entire document text being analyzed.
 * @param start - Absolute offset where the opening delimiter appears.
 * @param open - Opening delimiter character.
 * @param close - Closing delimiter character.
 * @returns Details describing the delimited section, or `null` when no closing delimiter is found.
 */
const extractDelimitedSection = (
  text: string,
  start: number,
  open: string,
  close: string
): DelimitedSection | null => {
  if (text[start] !== open) {
    return null
  }

  let index = start
  let depth = 0
  let stringDelimiter: string | null = null
  let contentStart = -1

  while (index < text.length) {
    const character = text[index]

    if (stringDelimiter) {
      if (character === '\\') {
        index += 2
        continue
      }

      if (character === stringDelimiter) {
        stringDelimiter = null
      }

      index += 1
      continue
    }

    if (character === '\\' && index + 1 < text.length) {
      index += 2
      continue
    }

    if (character === '"' || character === "'" || character === '`') {
      stringDelimiter = character
      index += 1
      continue
    }

    if (character === open) {
      depth += 1
      if (depth === 1) {
        contentStart = index + 1
      }
      index += 1
      continue
    }

    if (character === close) {
      depth -= 1
      if (depth === 0) {
        return {
          content: text.slice(contentStart, index),
          contentStart,
          contentEnd: index,
          endIndex: index + 1
        }
      }
      index += 1
      continue
    }

    index += 1
  }

  return null
}

/**
 * Represents the decoded contents of a quoted string literal.
 */
interface QuotedString {
  /** Unescaped string content. */
  value: string
  /** Absolute offset where the string content begins. */
  start: number
  /** Absolute offset where the string content ends (exclusive). */
  end: number
}

/**
 * Decode an escape sequence that begins at the provided offset.
 *
 * @param text - The string literal under evaluation.
 * @param start - Offset of the backslash introducing the escape sequence.
 * @returns The decoded text and number of characters consumed.
 */
const decodeEscapeSequence = (
  text: string,
  start: number
): { value: string; length: number } => {
  const next = text[start + 1]
  if (!next) {
    return { value: '\\', length: 1 }
  }

  switch (next) {
    case 'n':
      return { value: '\n', length: 2 }
    case 'r':
      return { value: '\r', length: 2 }
    case 't':
      return { value: '\t', length: 2 }
    case 'b':
      return { value: '\b', length: 2 }
    case 'f':
      return { value: '\f', length: 2 }
    case '\\':
      return { value: '\\', length: 2 }
    case '"':
      return { value: '"', length: 2 }
    case "'":
      return { value: "'", length: 2 }
    case '`':
      return { value: '`', length: 2 }
    case 'u': {
      const shortHex = text.slice(start + 2, start + 6)
      if (/^[0-9a-fA-F]{4}$/.test(shortHex)) {
        return {
          value: String.fromCharCode(Number.parseInt(shortHex, 16)),
          length: 6
        }
      }
      return { value: 'u', length: 2 }
    }
    case 'x': {
      const byte = text.slice(start + 2, start + 4)
      if (/^[0-9a-fA-F]{2}$/.test(byte)) {
        return {
          value: String.fromCharCode(Number.parseInt(byte, 16)),
          length: 4
        }
      }
      return { value: 'x', length: 2 }
    }
    default:
      return { value: next, length: 2 }
  }
}

/**
 * Convert the raw contents of a string literal into its unescaped value.
 *
 * @param text - Raw string literal content without surrounding quotes.
 * @returns The decoded string with escape sequences resolved.
 */
const decodeStringLiteral = (text: string): string => {
  let index = 0
  let result = ''

  while (index < text.length) {
    const character = text[index]
    if (character === '\\') {
      const { value, length } = decodeEscapeSequence(text, index)
      result += value
      index += length
      continue
    }

    result += character
    index += 1
  }

  return result
}

/**
 * Decode a subset of HTML entities commonly emitted by Twine when serializing passage names.
 *
 * @param value - Text possibly containing HTML entities.
 * @returns Text with known entities converted to their corresponding characters.
 */
const decodeHtmlEntities = (value: string): string =>
  value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_, entity: string) => {
    if (entity.startsWith('#')) {
      const isHex = entity[1]?.toLowerCase() === 'x'
      const numeric = isHex ? entity.slice(2) : entity.slice(1)
      const codePoint = Number.parseInt(numeric, isHex ? 16 : 10)
      return Number.isNaN(codePoint)
        ? `&${entity};`
        : String.fromCodePoint(codePoint)
    }

    switch (entity.toLowerCase()) {
      case 'amp':
        return '&'
      case 'lt':
        return '<'
      case 'gt':
        return '>'
      case 'quot':
        return '"'
      case 'apos':
        return "'"
      default:
        return `&${entity};`
    }
  })

/**
 * Extract the first quoted string literal from the supplied content, returning its unescaped value
 * and absolute range within the document.
 *
 * @param content - Text that may begin with optional whitespace followed by a quoted literal.
 * @param contentStart - Absolute offset where the content originates in the document.
 * @returns Decoded string details or `null` when a quoted literal cannot be resolved.
 */
const extractQuotedString = (
  content: string,
  contentStart: number
): QuotedString | null => {
  let index = 0

  while (index < content.length && /\s/.test(content[index])) {
    index += 1
  }

  const quote = content[index]
  if (quote !== '"' && quote !== "'" && quote !== '`') {
    return null
  }

  const valueStart = index + 1
  let pointer = valueStart

  while (pointer < content.length) {
    const character = content[pointer]
    if (character === '\\') {
      const { length } = decodeEscapeSequence(content, pointer)
      pointer += length
      continue
    }

    if (character === quote) {
      const raw = content.slice(valueStart, pointer)
      return {
        value: decodeHtmlEntities(decodeStringLiteral(raw)),
        start: contentStart + valueStart,
        end: contentStart + pointer
      }
    }

    pointer += 1
  }

  return null
}

/**
 * Advance past any whitespace characters starting at the provided offset.
 *
 * @param text - Document text under inspection.
 * @param index - Offset where whitespace skipping should begin.
 * @returns Offset of the first non-whitespace character at or after `index`.
 */
const skipWhitespace = (text: string, index: number): number => {
  let pointer = index
  while (pointer < text.length && /\s/.test(text[pointer])) {
    pointer += 1
  }
  return pointer
}

/**
 * Build a lookup of passage names defined within the current document.
 *
 * @param document - Active Campfire text document.
 * @returns Map from normalized passage names to their corresponding ranges.
 */
const passageDefinitionCache = new WeakMap<
  TextDocument,
  { version: number; definitions: Map<string, Range> }
>()

const collectPassageDefinitions = (
  document: TextDocument
): Map<string, Range> => {
  const cached = passageDefinitionCache.get(document)
  if (cached && cached.version === document.version) {
    return cached.definitions
  }

  const text = document.getText()
  const definitions = new Map<string, Range>()

  const tweeHeadingPattern = /^::\s*([^\[{\r\n]*)/gm
  let headingMatch: RegExpExecArray | null
  while ((headingMatch = tweeHeadingPattern.exec(text))) {
    const captured = headingMatch[1]
    const trimmed = captured.trim()
    if (!trimmed) {
      continue
    }

    const prefixLength = headingMatch[0].length - captured.length
    const leadingWhitespace = captured.length - captured.trimStart().length
    const nameStart = headingMatch.index + prefixLength + leadingWhitespace
    const nameEnd = nameStart + trimmed.length
    const range = new Range(
      document.positionAt(nameStart),
      document.positionAt(nameEnd)
    )

    const normalized = decodeHtmlEntities(trimmed)
    if (!definitions.has(normalized)) {
      definitions.set(normalized, range)
    }
  }

  const passageTagPattern = /<tw-passagedata\b[^>]*>/gi
  let tagMatch: RegExpExecArray | null
  while ((tagMatch = passageTagPattern.exec(text))) {
    const tag = tagMatch[0]
    const nameMatch = /\bname\s*=\s*(['"])(.*?)\1/i.exec(tag)
    if (!nameMatch) {
      continue
    }

    const attributeOffset = nameMatch.index
    const quote = nameMatch[1]
    const rawName = nameMatch[2]
    const quoteIndex = tag.slice(attributeOffset).indexOf(quote)
    const valueStart = tagMatch.index + attributeOffset + quoteIndex + 1
    const valueEnd = valueStart + rawName.length
    const range = new Range(
      document.positionAt(valueStart),
      document.positionAt(valueEnd)
    )
    const normalized = decodeHtmlEntities(rawName)

    if (!definitions.has(normalized)) {
      definitions.set(normalized, range)
    }
  }

  passageDefinitionCache.set(document, {
    version: document.version,
    definitions
  })

  return definitions
}

/**
 * Locate passage references made via `goto` directives within the current document.
 *
 * @param document - Active Campfire text document.
 * @returns All `goto` references paired with their clickable ranges.
 */
const collectGotoReferences = (document: TextDocument): PassageReference[] => {
  const text = document.getText()
  const references: PassageReference[] = []
  const directivePattern = /(?<!:)(?<!\\)(::|:)goto/gi
  let match: RegExpExecArray | null

  while ((match = directivePattern.exec(text))) {
    let offset = match.index + match[0].length
    offset = skipWhitespace(text, offset)

    let labelReference: PassageReference | null = null
    if (text[offset] === '[') {
      const label = extractDelimitedSection(text, offset, '[', ']')
      if (label) {
        const quoted = extractQuotedString(label.content, label.contentStart)
        if (quoted) {
          labelReference = {
            passage: quoted.value,
            range: new Range(
              document.positionAt(quoted.start),
              document.positionAt(quoted.end)
            )
          }
        }
        offset = label.endIndex
      }
    }

    offset = skipWhitespace(text, offset)
    if (text[offset] !== '{') {
      if (labelReference) {
        references.push(labelReference)
      }
      continue
    }

    const attributes = extractDelimitedSection(text, offset, '{', '}')
    if (!attributes) {
      if (labelReference) {
        references.push(labelReference)
      }
      continue
    }

    const attributeContent = attributes.content
    const passagePattern = /\bpassage\b\s*=\s*/gi
    let passageMatch: RegExpExecArray | null
    let foundPassageAttribute = false
    while ((passageMatch = passagePattern.exec(attributeContent))) {
      const valueIndex = passageMatch.index + passageMatch[0].length
      const quoted = extractQuotedString(
        attributeContent.slice(valueIndex),
        attributes.contentStart + valueIndex
      )

      if (quoted) {
        foundPassageAttribute = true
        references.push({
          passage: quoted.value,
          range: new Range(
            document.positionAt(quoted.start),
            document.positionAt(quoted.end)
          )
        })
        passagePattern.lastIndex = quoted.end - attributes.contentStart + 1
      }
    }

    if (!foundPassageAttribute && labelReference) {
      references.push(labelReference)
    }
  }

  return references
}

/**
 * Locate passage references created by Twine-style wikilinks (autolinks).
 *
 * @param document - Active Campfire text document.
 * @returns Autolink references and their clickable ranges.
 */
const collectAutolinkReferences = (
  document: TextDocument
): PassageReference[] => {
  const text = document.getText()
  const references: PassageReference[] = []
  const autolinkPattern = /\[\[([\s\S]+?)\]\]/g
  let match: RegExpExecArray | null

  while ((match = autolinkPattern.exec(text))) {
    const content = match[1]
    let targetSegment = content
    let segmentOffset = 0

    const reverseArrowIndex = content.indexOf('<-')
    const forwardArrowIndex = content.lastIndexOf('->')
    const pipeIndex = content.lastIndexOf('|')
    const bracketIndex = content.indexOf('][')

    if (forwardArrowIndex !== -1 && forwardArrowIndex + 2 < content.length) {
      segmentOffset = forwardArrowIndex + 2
      targetSegment = content.slice(segmentOffset)
    } else if (reverseArrowIndex !== -1) {
      targetSegment = content.slice(0, reverseArrowIndex)
      segmentOffset = 0
    } else if (pipeIndex !== -1 && pipeIndex + 1 < content.length) {
      segmentOffset = pipeIndex + 1
      targetSegment = content.slice(segmentOffset)
    } else if (bracketIndex !== -1 && bracketIndex + 2 < content.length) {
      segmentOffset = bracketIndex + 2
      targetSegment = content.slice(segmentOffset)
    }

    const trimmed = targetSegment.trim()
    if (!trimmed) {
      continue
    }

    const leadingWhitespace =
      targetSegment.length - targetSegment.trimStart().length
    const start = match.index + 2 + segmentOffset + leadingWhitespace
    const end = start + trimmed.length
    references.push({
      passage: decodeHtmlEntities(trimmed),
      range: new Range(document.positionAt(start), document.positionAt(end))
    })
  }

  return references
}

/**
 * Resolve the range of the passage definition matching the supplied name.
 *
 * @param definitions - Map of passage definitions extracted from the document.
 * @param passage - Passage name referenced in the document.
 * @returns The range of the matching definition, if one exists.
 */
const resolveDefinitionRange = (
  definitions: Map<string, Range>,
  passage: string
): Range | undefined => {
  const direct = definitions.get(passage)
  if (direct) {
    return direct
  }

  const normalized = passage.toLowerCase()
  for (const [key, range] of definitions) {
    if (key.toLowerCase() === normalized) {
      return range
    }
  }

  return undefined
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

  const definitionProvider = languages.registerDefinitionProvider(
    { language: 'campfire' },
    {
      /**
       * Provide passage definitions for Campfire navigation constructs.
       */
      provideDefinition(document: TextDocument, position: Position) {
        const definitions = collectPassageDefinitions(document)
        if (!definitions.size) {
          return undefined
        }

        const references = [
          ...collectGotoReferences(document),
          ...collectAutolinkReferences(document)
        ]
        const reference = references.find(entry =>
          entry.range.contains(position)
        )
        if (!reference) {
          return undefined
        }

        const range = resolveDefinitionRange(definitions, reference.passage)
        return range ? new Location(document.uri, range) : undefined
      }
    }
  )

  context.subscriptions.push(provider, definitionProvider)
}

/**
 * Clean up any resources when the extension is deactivated.
 */
export function deactivate(): void {
  // No resources to dispose of because subscriptions are managed by VS Code.
}
