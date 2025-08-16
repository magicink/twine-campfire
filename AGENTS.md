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
