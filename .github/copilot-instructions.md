# Copilot Instructions

## Overview

- Twine Campfire is a custom story format for [Twine](https://twinery.org/) built with Preact and TypeScript.
- The project uses [Bun](https://bun.sh/) as the JavaScript runtime and package manager.
- This monorepo contains the main story format in `apps/campfire` and shared utilities in `packages/*`.
- Source files are TypeScript/TSX; build artifacts live in `dist/` directories.
- Whenever `AGENTS.md` is updated, update this file to keep instructions synchronized.

## Build & Validation

1. **Install**: Always run `bun install` after cloning or switching branches.
2. **Format**: Run `bun x prettier --write .` before committing.
3. **Type check**: Run `bun run typecheck` (which executes `tsc --noEmit`).
4. **Test**: Run `bun test`.
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

## Directives and Attributes

### Container directives

- Always group nested container directives within their parent until the closing `:::` marker.
- Filter out whitespace-only nodes and directive markers before committing content to a slide.
- Use helpers like `stripLabel`, `removeDirectiveMarker`, and `runBlock` to handle labels and markers.
- Add regression tests for new container directives to prevent splitting issues.
- Keep any blank lines between the opening tag and content and between content and the closing tag to avoid breaking grouping.

### Attributes

- If a directive attribute's value is surrounded by quotes or backticks, it MUST be treated as a string and NEVER converted into JSON, even if the contents of the string appear to be JSON.
- Wrap string values in quotes or backticks unless referencing a state key.
- To pass an object via an attribute, do not wrap the object in quotes (e.g., `:directive{attribute={key: val}}`).

## Notes

- Prefer arrow functions and include JSDoc comments for functions and components.
- Visual components must include `data-testid` attributes and a default `campfire-{name}` class with no associated styles.
- Trust these instructions and search the repository only if information is missing or incorrect.
- Define colors using `oklch()` notation instead of hex or other color formats.
