# Recurring issues

## Inline directives after nested containers

Container directives that contain another container followed by an inline directive have repeatedly failed to render the inline directive. The parent container would swallow the following directive or leave its `:::` marker in the output when it didn't recursively process the child container or strip marker nodes.

Regression tests cover this scenario:

- `apps/campfire/src/hooks/__tests__/layerDirective.test.tsx` ensures a `layer` with a nested `wrapper` still renders a `radio` directive that follows.
- `apps/campfire/src/hooks/__tests__/triggerDirective.test.tsx` verifies a `trigger` wrapper can display text and an `image` before an inline `:set` directive.

When adding or updating container directives, verify that inline directives after nested containers render correctly and add regression tests to prevent this regression from returning.
