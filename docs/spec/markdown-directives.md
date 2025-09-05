# Campfire Markdown Directives — Specification

This document defines the normative behavior for Campfire’s Markdown directives. It establishes canonical syntax, attribute semantics, processing rules, and error handling to guide consistent implementation and testing.

## Goals & Scope

- Ensure predictable parsing and transformation of directives across remark/rehype and runtime handlers.
- Prevent edge‑case regressions (grouping, whitespace, nesting, attributes).
- Be testable: each rule maps to concrete acceptance tests.

## Terminology

- Container directive: Block directive that can contain child nodes. Written with leading and trailing `:::` markers (e.g., `:::if … :::`).
- Leaf directive: Block-level directive with no nested content. Written with leading `::` markers (e.g., `::image{src="cat.png"}`).
- Inline directive: Directive embedded in text flow, written with a single leading `:` (e.g., `:show[hp]`). Parsed by `remark-directive` as a text directive.
- Label: The optional first paragraph inside a container used to carry short values (e.g., an expression for `if`). Some leaf directives also use labels for metadata, such as the locale for `::lang`.
- Marker: A paragraph composed solely of directive marker tokens `:::` and whitespace.
- State key: Unquoted identifier path referencing game state (e.g., `user.name`, `items[0]`).

## Syntax

- Container: `:::name[optional-label]{attrs}\n…children…\n:::`
- Leaf: `::name[optional-label]{attrs}`
- Inline: `:name[optional-label]{attrs}` in text flow.

Notes

- Keep a blank line after the opening `:::` and before the closing `:::` when authoring multi-line content. This preserves grouping in upstream Markdown parsers and avoids accidental paragraph wrapping.
- Inside tables and lists, directives must not disrupt layout; alignment and list structure are preserved.

## Attributes

General

- Quoted or backticked values MUST be treated as strings; do not coerce or JSON-parse quoted strings even if they “look like” JSON.
- Wrap literal strings in quotes or backticks unless referencing a state key.
- All string attributes support `${...}` interpolation (e.g., `className`, `layerClassName`, `style`).
- Safe attribute characters: attribute extraction only accepts values composed of safe characters to reduce injection risk.
- New directive attributes must be exposed through their handlers and accompanied by directive tests verifying their behavior.

Special cases (validation enforced by remark plugin)

- `trigger[label]` or `:::trigger{label="..."}`: `label` MUST be a quoted/backticked string.
- `slide{transition="..."}` (and `deck > slide transition`): `transition` MUST be a quoted/backticked string.
- `id` or `layerId` attributes across directives MUST be quoted/backticked strings unless referencing a state key path. Unquoted literals (e.g., `id=foo`) are invalid; unquoted state keys (e.g., `id=cp.id`) are allowed.

Evaluation

- Attribute parsing and evaluation happens according to per‑directive schemas in handlers. For schema types:
  - string: quoted strings remain strings; unquoted may be evaluated unless `expression: false`.
  - number/boolean: may be evaluated from expressions; otherwise parsed from string.
  - object/array: if unquoted, may be evaluated or parsed from JSON; quoted stays a string.

## Labels

- A container’s first child paragraph may be a label. Use `stripLabel(children)` to remove it before processing content; use `getLabel(container)` to read it.
- Labels are preserved as text for components that render them (e.g., `trigger`), and omitted where the label is only metadata (e.g., `if` expression, `lang` locale).

## Grouping & Whitespace

- Nested container directives MUST remain grouped within their parent until the parent’s closing `:::` marker is reached. Author blank lines must be preserved; whitespace‑only nodes and marker paragraphs MUST be filtered before committing content to a slide/component.
- Paragraphs that contain only directive markers (with arbitrary whitespace between them) are considered marker nodes and MUST be removed by handlers when inlining children. Use `removeDirectiveMarker(parent, index)` after inserting processed content.
- Paragraphs with no meaningful content (whitespace only) should be dropped once any directive transformations are applied.

## Processing Pipeline

Remark phase

1. Parse Markdown with `remark-parse`, GFM, and `remark-directive`.
2. Apply `remarkCampfireIndentation` to attach trailing indentation to the following directive node.
3. Apply `remarkCampfire` to:
   - Extract fallback attributes from trailing text/inlineCode when needed (safe characters only).
   - Enforce quoting rules for special attributes (above).
   - Optionally invoke directive handlers supplied by runtime.

Runtime handlers (useDirectiveHandlers)

- For container directives, first process children:
  - Expand indented code blocks into Markdown nodes via `expandIndentedCode(children)`.
  - Recursively run nested directives with `runDirectiveBlock(expandIndentedCode(children))`.
  - Remove label with `stripLabel` when appropriate.
  - Filter whitespace‑only nodes and marker paragraphs.
- After transforming, replace the directive in its parent while preserving indentation via `replaceWithIndentation` and remove the trailing marker paragraph with `removeDirectiveMarker`.

Recursion requirement

- A container directive’s handler MUST recursively process any nested container directives in its children by running the directive pipeline (e.g., `runDirectiveBlock(expandIndentedCode(children))`). Only skip recursion when a directive explicitly forbids nested containers (see Forbidden Nesting).

## Nesting Rules

Allowed

- Nested containers are allowed unless explicitly disallowed by the directive’s own spec.

Forbidden

- `batch` inside `batch` is forbidden. Handlers MUST remove nested `batch` and report an error.
- `onExit` content: only allows a defined allowlist of data directives. Other nodes are invalid and should be reported.
- `effect` content: only allows a defined allowlist of data directives. Other nodes are invalid and should be reported.

## Error Handling

- Unknown directives without handlers are left as-is in the AST (no transformation).
- Invalid attributes for enforced quoting rules are dropped from the directive and a message is reported to the file diagnostics.
- Disallowed nesting (e.g., nested `batch`) removes the offending directive and emits an error.
- Handlers SHOULD log and surface errors through the game store where applicable.

## Examples

Attribute quoting

```md
:checkpoint{id="cp1"} <!-- valid -->
:checkpoint{id=cp.id} <!-- valid state key -->
:checkpoint{id=cp1} <!-- invalid; must be quoted -->

:::trigger{label="Fire"} <!-- valid -->
:::trigger{label=Fire} <!-- invalid; must be quoted -->
:::
```

Container grouping

```md
:::deck
:::slide{transition="fade"}
Content
:::
:::
```

- The `slide` remains within the `deck` until the deck’s closing marker.
- A marker paragraph following inlined children MUST be removed.

Recursion

```md
:::if[user.isAdmin]
:::batch
::set[role="admin" loggedIn=true]
:::
:::
```

- `if` handler MUST run directive processing on its children so nested `batch` and `set` execute.
- Nested `batch` inside `batch` MUST be rejected with an error.

Tables

```md
| Stat |     Value |
| :--- | --------: |
| HP   | :show[hp] |
```

- Column alignment remains intact; directive expansion MUST NOT break table layout.

## Acceptance Tests (Minimum)

Grouping & whitespace

- Nested containers remain within the parent until its `:::` closes.
- Whitespace‑only nodes and marker paragraphs are removed after inlining.
- Paragraph unwrap for directive components (e.g., select/option/input/trigger) produces expected HAST without stray wrappers.

Attributes

- Quoted vs unquoted parsing matrix (string/object/array/number/boolean) including safe‑character fallback behavior.
- Special quoting: `trigger.label`, `slide.transition`, `id` across `checkpoint/save/load/clearSave`.

Recursion & nesting

- Child containers re‑run through `runDirectiveBlock(expandIndentedCode(children))`.
- Nested `batch` rejected with clear error; `onExit` only permits allowed directives and flags others.

Stability

- Directives in tables preserve alignment.
- Indentation preserved in list items and blockquotes through replacement.

## Implementation Notes

- Use helpers from `@campfire/utils/directiveUtils`: `stripLabel`, `getLabel`, `expandIndentedCode`, `runDirectiveBlock`, `replaceWithIndentation` and the local `removeDirectiveMarker` in handlers.
- Prefer arrow functions where applicable; include JSDoc on functions and components; UI components add `data-testid` and a default `campfire-{name}` class.
- Colors in examples and components must use `oklch()` values.
