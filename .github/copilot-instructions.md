# Copilot Instructions

## Essentials

- Twine Campfire is a Preact + TypeScript story format managed with Bun.
- The main runtime lives in `apps/campfire`; shared packages sit under `packages/*`; the VS Code extension is in `projects/campfire-vscode-extension`.

## Workflow

1. Run `bun install` after cloning or switching branches.
2. Run `bun tsc` (or `bun run typecheck`), `bun test`, and `bunx prettier . --write` before committing.
3. Run `bun run build` to refresh bundled output when needed.
4. Use Conventional Commits for message formatting.

## Standards

- Store functions with arrow syntax and document every function/component with JSDoc.
- Visual components must expose `data-testid` props and a default `campfire-{name}` class without attached styles.
- Use `oklch()` color values and never edit `CHANGELOG.md` manually.
- Keep Husky hooks self-contained; do not source `.husky/_/husky.sh`.
- Mirror guidance between this file and `AGENTS.md`.
- Keep Storybook stories in sync with React component changes and avoid introducing new helper files unless needed.
- Update `template.ejs` alongside the Storybook preview template.

## VS Code Extension

- Keep directive snippets in `src/extension.ts` and `snippets/campfire.code-snippets` aligned in coverage and syntax; container snippets leave `$0` inside an empty body.
- When directive behavior changes, update the extension files, bump `projects/campfire-vscode-extension/package.json` version, run `bun install` and `bun run package`, and update related docs/tests.
- Ship runtime and extension updates together so reviewers can verify compatibility; package locally if desired.
