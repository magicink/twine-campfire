# Repository Guidelines

- Run `bun tsc`, `bun test`, and `bunx prettier . --write` before committing.
- Write arrow functions when storing functions.
- Give every function and component a JSDoc block.
- Visual components need `data-testid` attributes and a default `campfire-{name}` class without styles.
- Use Conventional Commits, `oklch()` colors, and never edit `CHANGELOG.md` directly.
- Mirror changes between this file and `.github/copilot-instructions.md`.
- Keep Husky hooks self-contained (do not source `.husky/_/husky.sh`).
- Keep `template.ejs` and the Storybook preview template aligned.
- Update Storybook stories whenever you change React components.
- Avoid adding new helper files unless absolutely necessary.

## VS Code Extension

- Keep directive snippets in `src/extension.ts` and `snippets/campfire.code-snippets` aligned in coverage and syntax.
- Container snippets place `$0` inside an empty body; no default children.
- When directive behavior changes, update the extension (`projects/campfire-vscode-extension/*`), bump its `package.json` version, run `bun install` and `bun run package`, and update docs/tests.
- Before merging author-facing changes: refresh the extension files above, package and test locally if needed, and open a PR that covers both runtime and extension updates.
