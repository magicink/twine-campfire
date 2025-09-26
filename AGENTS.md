# Repository Guidelines

- Always run a type check (`bun tsc` or `tsc`) before committing. This helps catch type errors early.
- After making changes, run `bun test` to verify the test suite passes.
- Run Prettier (`bunx prettier . --write`) once just before finishing up your changes.
- When writing tests, exercise both truthy and falsey paths for conditional logic.
- Prefer arrow functions for holding functions when possible.
- Include JSDoc comments for all functions and components.
- Always add `data-testid` attributes to visual components.
- Ensure every visual component includes a default `campfire-{name}` class with no associated styles.
- Use Conventional Commits for all commit messages.
- Define colors using `oklch()` notation instead of hex or other color formats.
- Never directly edit `CHANGELOG.md`; it is managed automatically.
- If this `AGENTS.md` file is updated, also update `.github/copilot-instructions.md` to reflect the changes.

*

- Husky hooks: do not source `.husky/_/husky.sh` in hook scripts. That helper is ignored by the repo and sourcing it will be removed in future Husky versions; instead, keep hooks self-contained. @codex
- If you update the `template.ejs` file, also update the Storybook preview template to keep them in sync.
- If you update React components, add or update corresponding Storybook stories to reflect the changes.

## Coding Standards

- Do not create new files for helpers or utilities unless absolutely necessary. Prefer fewer utility or helper files overall.

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

    cd projects\campfire-vscode-extension
    bun install
    bun run package

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
