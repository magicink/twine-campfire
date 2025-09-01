# Repository Guidelines

- Always run `bun x prettier --write .` before committing. This ensures consistent formatting across the project.
- Always run a type check (`bun tsc` or `tsc`) before committing. This helps catch type errors early.
- After making changes, run `bun test` to verify the test suite passes.
- Prefer arrow functions for holding functions when possible.
- Include JSDoc comments for all functions and components.
- Always add `data-testid` attributes to visual components.
- Ensure every visual component includes a default `campfire-{name}` class with no associated styles.
- Use Conventional Commits for all commit messages.
- Define colors using `oklch()` notation instead of hex or other color formats.
- If this `AGENTS.md` file is updated, also update `.github/copilot-instructions.md` to reflect the changes.
- If you update the `template.ejs` file, also update the Storybook preview template to keep them in sync.
- If you update React components, add or update corresponding Storybook stories to reflect the changes.

## Coding Standards

- Do not create new files for helpers or utilities unless absolutely necessary. Prefer fewer utility or helper files overall.

## Directives and Attributes

See `docs/spec/markdown-directives.md` for the normative directive spec (syntax, attributes, recursion, grouping, and tests).

### Container directives

- Always group nested container directives within their parent until the closing `:::` marker.
- Filter out whitespace-only nodes and directive markers before committing content to a slide.
- Use helpers like `stripLabel`, `removeDirectiveMarker`, and `runBlock` to handle labels and markers.
- Add regression tests for new container directives to prevent splitting issues.
- Keep any blank lines between the opening tag and content and between content and the closing tag to avoid breaking grouping.
- Recursion: After a container directive performs its own processing (such as parsing attributes, filtering nodes, or handling labels), its handler must recursively process any nested container directives in its children. This is accomplished by passing the container’s child nodes back through the directive-processing pipeline (for example, by calling `runDirectiveBlock(expandIndentedCode(children))` in the handler). This ensures that container directives embedded within other container directives are executed just like top‑level directives. Only skip this recursive processing when a directive’s specification explicitly forbids nested container directives (for instance, batch directives disallow other batch directives inside them).

### Container end‑of‑block detection (important)

For any container directive (e.g., `trigger`, `if`, `select`, `layer`, `wrapper`, `deck`, `slide`), end‑of‑block detection must be robust so that content following the container is not accidentally captured inside it. Implement the following rules (see `apps/campfire/src/hooks/useDirectiveHandlers.ts`):

- Stop scanning for container content at the first closing marker, whether it appears as:
  - a paragraph consisting only of directive markers (e.g., `:::`), or
  - a bare text node whose content is only directive markers (e.g., `:::`), possibly with surrounding whitespace.
- Additionally, defensively stop at the first sibling directive node if encountered before the marker. This avoids folding subsequent directives into the current container when the closing marker is parsed unexpectedly.
- Do not remove marker‑only paragraphs/text globally in the remark phase. Container handlers rely on seeing the closing marker to delimit their blocks. See `apps/campfire/src/remark-campfire/index.ts` — marker‑only removal is avoided there.
- When constructing a container’s output:
  - Process its children as needed by the directive’s semantics (e.g., only pre‑process labels for `trigger`), not necessarily full directive execution if the intent is to defer execution (e.g., click‑time execution for `trigger`).
  - Collect any sibling nodes between the opening line and the detected closing marker that belong to the container; filter out marker‑only nodes and directive‑specific exclusions (e.g., wrapper label nodes). Merge or serialize these according to the directive’s semantics (e.g., merge event directives; serialize deferred content).
- Add regression tests for end‑of‑block detection whenever introducing or modifying a container directive, including cases where the closing marker appears as a paragraph vs. a bare text node, and with blank lines or indentation.

If content “after a container” fails to render or containers accidentally swallow following directives, verify these sentinels and ensure marker‑only nodes are not removed before the handler runs.

### Attributes

- If a directive attribute's value is surrounded by quotes or backticks, it MUST be treated as a string and NEVER converted into JSON, even if the contents of the string appear to be JSON.
- Wrap string values in quotes or backticks unless referencing a state key.
- To pass an object via an attribute, do not wrap the object in quotes (e.g., `:directive{attribute={key: val}}`).
