# Repository Guidelines

- Always run `bun x prettier --write .` before committing. This ensures consistent formatting across the project.
- Always run a type check (`bun tsc` or `tsc`) before committing. This helps catch type errors early.
- After making changes, run `bun test` to verify the test suite passes.
- Prefer arrow functions for holding functions when possible.
- Include JSDoc comments for all functions and components.
- Always add `data-testid` attributes to visual components.
- Use Conventional Commits for all commit messages.
- If you update the `template.ejs` file, also update the Storybook preview template to keep them in sync.
- If you update React components, add or update corresponding Storybook stories to reflect the changes.
- When processing container directives:
  - Always group nested container directives within their parent until the closing `:::` marker.
  - Filter out whitespace-only nodes and directive markers before committing content to a slide.
  - Use helpers like `stripLabel`, `removeDirectiveMarker`, and `runBlock` to handle labels and markers.
  - Add regression tests for new container directives to prevent splitting issues.
  - Keep any blank lines between the opening tag and content and between content and the closing tag to avoid breaking grouping.
- When defining directive attributes, wrap string values in quotes or backticks unless referencing a state key.
