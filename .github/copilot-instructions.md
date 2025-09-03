# Copilot Instructions

## Overview

- Twine Campfire is a custom story format for [Twine](https://twinery.org/) built with Preact and TypeScript.
- The project uses [Bun](https://bun.sh/) as the JavaScript runtime and package manager.
- This monorepo contains the main story format in `apps/campfire` and shared utilities in `packages/*`.
- Source files are TypeScript/TSX; build artifacts live in `dist/` directories.
- Whenever `AGENTS.md` is updated, update this file to keep instructions synchronized.

## Build & Validation

1. **Install**: Always run `bun install` after cloning or switching branches.
2. **Type check**: Run `bun run typecheck` (which executes `tsc --noEmit`).
3. **Test**: Run `bun test`.
4. **Build**: Use `bun run build` to regenerate `dist/format.js`. This cleans `apps/campfire/dist`, bundles with Rollup, then assembles the final story format.
5. Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

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

Refer to `docs/spec/markdown-directives.md` for the canonical directive rules (syntax, attributes, recursion, grouping, and test expectations).

### Container directives

- Always group nested container directives within their parent until the closing `:::` marker.
- Filter out whitespace-only nodes and directive markers before committing content to a slide.
- Use helpers like `stripLabel`, `removeDirectiveMarker`, and `runBlock` to handle labels and markers.
- Add regression tests for new container directives to prevent splitting issues.
- Keep any blank lines between the opening tag and content and between content and the closing tag to avoid breaking grouping.
- Recursion: After a container directive performs its own processing (such as parsing attributes, filtering nodes, or handling labels), its handler must recursively process any nested container directives in its children. This is accomplished by passing the container’s child nodes back through the directive-processing pipeline (for example, by calling `runDirectiveBlock(expandIndentedCode(children))` in the handler). This ensures that container directives embedded within other container directives are executed just like top‑level directives. Only skip this recursive processing when a directive’s specification explicitly forbids nested container directives (for instance, batch directives disallow other batch directives inside them).

### Container end-of-block detection (important)

For all container directives (`trigger`, `if`, `select`, `layer`, `wrapper`, `deck`, `slide`, etc.):

- Delimit the container by stopping at either a marker paragraph (paragraph of only `:::`) or a marker text node (text node whose content is only `:::`). Defensively stop at the first sibling directive if encountered before the marker to avoid swallowing following directives.
- Do not remove marker-only nodes in the remark phase; container handlers need to see the closing marker for correct delimiting.
- Build the container’s output per directive semantics:
  - Process children only as needed (e.g., pre-process wrapper label for `trigger`, not full directive execution when deferring work to runtime).
  - Fold sibling nodes up to the marker into the container, filtering out marker-only nodes and directive-specific exclusions; merge event directives appropriately.

If content after a container stops rendering or is captured unexpectedly, check these sentinel rules first.

If a container directive nests another container and is followed by an inline directive, confirm the inline directive renders and does not leave stray `:::` markers. This regression has appeared repeatedly; add tests for these cases. See `docs/recurring-issues.md` for more information.

### Attributes

- If a directive attribute's value is surrounded by quotes or backticks, it MUST be treated as a string and NEVER converted into JSON, even if the contents of the string appear to be JSON.
- Wrap string values in quotes or backticks unless referencing a state key.
- When adding new directive attributes, expose them via the directive API and extend directive tests to cover them.

## Notes

- Prefer arrow functions and include JSDoc comments for functions and components.
- Visual components must include `data-testid` attributes and a default `campfire-{name}` class with no associated styles.
- Trust these instructions and search the repository only if information is missing or incorrect.
- Define colors using `oklch()` notation instead of hex or other color formats.
- Ensure tests cover both truthy and falsey paths for conditional logic.
