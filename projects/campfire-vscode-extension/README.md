# Campfire Storybuilder VS Code Extension

The Campfire Storybuilder extension adds syntax highlighting, directive snippets, and IntelliSense completions for Campfire story files inside Visual Studio Code. Point it at `.twee` or `.tws` documents to get inline help for Campfire's directive syntax and container layout blocks.

## Features

- TextMate grammar that highlights Campfire directive markers, names, and attributes so story logic stands out from prose.
- Colon-triggered IntelliSense snippets for directives such as `::set`, `::trigger`, `:::deck`, and other Campfire building blocks.
- Language configuration that wires up bracket matching, directive indentation, and snippet surrounds tailored for Campfire containers.

## Prerequisites

- [Bun](https://bun.sh/) 1.0 or later
- [Node.js](https://nodejs.org/) 18 or later (required by the VS Code packaging tool)
- [Visual Studio Code](https://code.visualstudio.com/)

## Install dependencies

At the repository root, install the workspace dependencies (this also pulls the extension's TypeScript tooling):

```sh
bun install
bun run build
bun run package
```

## Build the extension

Compile the TypeScript source to `dist/extension.js` before packaging or running the extension in a development host:

```sh
bun run --filter campfire-storybuilder build
```

To watch for changes while developing, use:

```sh
bun run --filter campfire-storybuilder watch
```

## Package the extension

Create a distributable `.vsix` archive using the bundled `vsce` CLI. The packaging script passes `--no-dependencies` so that `vsce` skips `npm list` validation (our workspace is managed by Bun rather than `npm`).

```sh
bun run --filter campfire-storybuilder package
```

The command writes `campfire-storybuilder-<version>.vsix` to the extension directory.

## Install into VS Code

1. Open Visual Studio Code.
2. Press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> (or <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> on macOS) to open the command palette.
3. Run **Extensions: Install from VSIX...** and select the generated `.vsix` file.
4. Reload VS Code if prompted.

After installation, open or create a file with the `.twee` or `.tws` extension to activate the Campfire language features.

## Campfire directive snippets

Campfire directives can be tedious to type by hand. The extension exposes completions for the most common operations:

- `::set`, `::setOnce`, `::createRange`, `::array`, and `::arrayOnce` state helpers.
- Inline utilities such as `:random`, `:input`, and `:show` for dynamic content.
- Container helpers including `:::if`, `:::else`, `:::for`, `::trigger`, `::select`, `:::deck`, `:::layer`, and `:::text`.

Trigger completions with `:` and use the snippet placeholders to tab through each directive's attributes.

> **Note:** Campfire's Twee/TWS formats require container and leaf directives that begin in column zero to be escaped with a leading backslash. The bundled snippets intentionally emit those escapes so reviewers know the `\:::` and `\::set` markers are correct and will compile in column-zero contexts.

## Updating the extension version

The extension's version number lives in `projects/campfire-vscode-extension/package.json`. Increment it when you ship new functionality so that VS Code recognizes the update when re-installing the `.vsix` file.
