# Copilot Instructions

## Overview

- Twine Campfire is a custom story format for [Twine](https://twinery.org/) built with Preact and TypeScript.
- The project uses [Bun](https://bun.sh/) as the JavaScript runtime and package manager.
- This monorepo contains the main story format in `apps/campfire` and shared utilities in `packages/*`.
- Source files are TypeScript/TSX; build artifacts live in `dist/` directories.
- Whenever `AGENTS.md` is updated, update this file to keep instructions synchronized.

## Build & Validation

1. **Install**: Always run `bun install` after cloning or switching branches.
2. **Type check**: Run `bun run typecheck` (which executes `tsc --noEmit`) or `bun tsc`.
3. **Test**: Run `bun test`.
4. **Format**: Run `bunx prettier . --write` once before committing the final changes.
5. **Build**: Use `bun run build` to regenerate `dist/format.js`. This cleans `apps/campfire/dist`, bundles with Rollup, then assembles the final story format.
6. Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

## Project Layout

- **Root**: configuration (`package.json`, `bunfig.toml`, `tsconfig.json`, `commitlint.config.js`, `release-please-config.json`) and scripts like `build-format.mjs`.
- **apps/campfire**: main story format
  - `src/` – application source code
  - `__tests__/` – test suite run by `bun test`
  - `rollup.config.mjs` – build config
- **packages/**: reusable libraries
  - `rehype-campfire`, `remark-campfire`, `use-game-store`, `use-story-data-store`
  - each package has `index.ts`, `__tests__/`, and its own `package.json`
- **CI**: `.github/workflows/test.yml` installs dependencies with Bun and runs `bun test` on pushes and pull requests.

## Coding Standards

- Do not create new files for helpers or utilities unless absolutely necessary. Prefer fewer utility or helper files overall.
- Prefer arrow functions for holding functions when possible.
- Include JSDoc comments for all functions and components.
- Always add `data-testid` attributes to visual components.
- Ensure every visual component includes a default `campfire-{name}` class with no associated styles.
- Define colors using `oklch()` notation instead of hex or other color formats.
- Never directly edit `CHANGELOG.md`; it is managed automatically.
- Ensure tests cover both truthy and falsey paths for conditional logic.
- If you update the `template.ejs` file, also update the Storybook preview template to keep them in sync.
- If you update React components, add or update corresponding Storybook stories to reflect the changes.
- Tag `@codex` in any comment.
- Trust these instructions and search the repository only if information is missing or incorrect.

## Directives and Attributes

Refer to `docs/spec/markdown-directives.md` for the canonical directive rules (syntax, attributes, recursion, grouping, and test expectations).

### Container directives

- Always group nested container directives within their parent until the closing `:::` marker.
- Filter out whitespace-only nodes and directive markers before committing content to a slide.
- Use helpers like `stripLabel`, `removeDirectiveMarker`, and `runBlock` to handle labels and markers.
- Add regression tests for new container directives to prevent splitting issues.
- Keep any blank lines between the opening tag and content and between content and the closing tag to avoid breaking grouping.
- Recursion: After a container directive performs its own processing (such as parsing attributes, filtering nodes, or handling labels), its handler must recursively process any nested container directives in its children. This is accomplished by passing the container's child nodes back through the directive-processing pipeline (for example, by calling `runDirectiveBlock(expandIndentedCode(children))` in the handler). This ensures that container directives embedded within other container directives are executed just like top‑level directives. Only skip this recursive processing when a directive's specification explicitly forbids nested container directives (for instance, batch directives disallow other batch directives inside them).

### Container end‑of‑block detection (important)

For any container directive (e.g., `trigger`, `if`, `select`, `layer`, `wrapper`, `deck`, `slide`), end‑of‑block detection must be robust so that content following the container is not accidentally captured inside it. Implement the following rules (see `apps/campfire/src/hooks/useDirectiveHandlers.ts`):

- Stop scanning for container content at the first closing marker, whether it appears as:
  - a paragraph consisting only of directive markers (e.g., `:::`), or
  - a bare text node whose content is only directive markers (e.g., `:::`), possibly with surrounding whitespace.
- Additionally, defensively stop at the first sibling directive node if encountered before the marker. This avoids folding subsequent directives into the current container when the closing marker is parsed unexpectedly.
- Do not remove marker‑only paragraphs/text globally in the remark phase. Container handlers rely on seeing the closing marker to delimit their blocks. See `apps/campfire/src/remark-campfire/index.ts` — marker‑only removal is avoided there.
- When constructing a container's output:
  - Process its children as needed by the directive's semantics (e.g., only pre‑process labels for `trigger`), not necessarily full directive execution if the intent is to defer execution (e.g., click‑time execution for `trigger`).
  - Collect any sibling nodes between the opening line and the detected closing marker that belong to the container; filter out marker‑only nodes and directive‑specific exclusions (e.g., wrapper label nodes). Merge or serialize these according to the directive's semantics (e.g., merge event directives; serialize deferred content).
- Add regression tests for end‑of‑block detection whenever introducing or modifying a container directive, including cases where the closing marker appears as a paragraph vs. a bare text node, and with blank lines or indentation.

If content "after a container" fails to render or containers accidentally swallow following directives, verify these sentinels and ensure marker‑only nodes are not removed before the handler runs.

If a container directive includes a nested container followed immediately by an inline directive, verify the inline directive renders and no stray `:::` markers remain. This regression has resurfaced multiple times; add tests for these scenarios.

### Attributes

- If a directive attribute's value is surrounded by quotes or backticks, it MUST be treated as a string and NEVER converted into JSON, even if the contents of the string appear to be JSON.
- Wrap string values in quotes or backticks unless referencing a state key.
- When adding new directive attributes, expose them through the directive API and update directive tests to cover the new behavior.

## VS Code Extension Directive Snippets

The VS Code extension provides two complementary snippet systems that must be kept aligned:

1. **IntelliSense snippets** (`projects/campfire-vscode-extension/src/extension.ts`) - Triggered by typing colons (`:`, `::`, `:::`)
2. **Code snippets** (`projects/campfire-vscode-extension/snippets/campfire.code-snippets`) - Triggered by typing `cf-*` prefixes

### Snippet Alignment Requirements

- Both snippet systems must cover the same comprehensive set of Campfire directives
- All snippets must use identical, correct syntax patterns
- Container directive snippets (using `:::`) should not provide default children content. Instead, place the cursor (`$0`) inside the empty container for users to fill in their own content
- This provides a cleaner starting point and doesn't assume what users want to include within their containers
- When adding or modifying directives, update both snippet sources to maintain consistency
- Ensure all directive snippets comply with the current API specifications in the documentation

## VS Code extension — maintenance and sync

- When you change any public-facing Campfire behavior (directive syntax, directive attributes, attribute parsing rules, snippets, or the template that authors use) you MUST update the VS Code extension located at `projects/campfire-vscode-extension/`.
  - Files to update in the extension:
    - `projects/campfire-vscode-extension/src/extension.ts` — IntelliSense, completions, and directive parsing logic
    - `projects/campfire-vscode-extension/snippets/campfire.code-snippets` — code snippets used by the editor
    - `projects/campfire-vscode-extension/syntaxes/campfire.tmLanguage.json` — update when tokenization or grammar changes
    - `projects/campfire-vscode-extension/language-configuration.json` — comment/bracket/indent rules changes
    - `projects/campfire-vscode-extension/package.json` — bump `version` when releasing a packaged extension

- Recommended local build & package steps (Windows `cmd.exe`):
  - Open a terminal at the repo root and run:

    Note: `bun run package` executes the extension's `prepackage` script (which runs the build), so you do not need to run `bun run build` separately.

    ```cmd
    cd projects\campfire-vscode-extension
    bun install
    bun run package
    ```

  - To test the packaged extension locally:
    - (Optional) Uninstall the previously installed extension:

      code --uninstall-extension campfire.campfire-storybuilder

    - Install the new VSIX:

      code --install-extension dist\campfire-storybuilder.vsix

    - Alternatively, run the extension in the VS Code Extension Development Host (use the built-in VS Code debugger / "Launch Extension" configuration).

- Release notes & versioning:
  - Bump `version` in `projects/campfire-vscode-extension/package.json` using a Conventional Commits friendly change (patch/minor/major as appropriate).
  - Commit changes and open a PR that describes both the Campfire runtime changes and the extension changes together so reviewers can verify compatibility.
  - If you publish to the marketplace, follow the `vsce` publishing workflow (this repo currently packages with `vsce package`).

- Documentation & tests:
  - Update `projects/campfire-vscode-extension/README.md` or the root docs when snippets, completions, or grammar change.
  - Keep the two snippet sources (`src/extension.ts` and `snippets/campfire.code-snippets`) in sync and add unit/integration tests where feasible.

- Quick checklist before merging Campfire changes that affect authors:
  1. Update extension files listed above.
  2. Run `bun install` (workspace) and `bun run package` inside the extension folder — `package` runs the `prepackage` script which performs the build.
  3. Package (optional) and test locally with `code --install-extension` or the Extension Development Host.
  4. Bump extension `version`, commit, and open PR linking runtime and extension changes.
