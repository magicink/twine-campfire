# Copilot Instructions

## Overview

- Twine Campfire is a custom story format for [Twine](https://twinery.org/) built with Preact and TypeScript.
- The project uses [Bun](https://bun.sh/) as the JavaScript runtime and package manager.
- This monorepo contains the main story format in `apps/campfire` and shared utilities in `packages/*`.
- Source files are TypeScript/TSX; build artifacts live in `dist/` directories.

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

## Notes

- Prefer arrow functions and include JSDoc comments for functions and components.
- Trust these instructions and search the repository only if information is missing or incorrect.
