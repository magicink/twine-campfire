# Repository Guidelines

- Always run `bun x prettier --write .` before committing. This ensures consistent formatting across the project.
- Always run a type check (`bun tsc` or `tsc`) before committing. This helps catch type errors early.
- After making changes, run `bun test` to verify the test suite passes.
- Do NOT use `unified().run()` in tests. It hangs indefinitely and will block your test runs.
- Prefer arrow functions for holding functions when possible.
- Include JSDoc comments for all functions and components.
- Use Conventional Commits for all commit messages.
