# Campfire Storybuilder — VS Code extension

This folder contains the Campfire Storybuilder Visual Studio Code extension.

This README explains how to build the extension and install the generated .vsix locally.

## Where the .vsix is produced

The extension package script outputs the VSIX into the `dist/` folder as `campfire-storybuilder.vsix`.

Path (relative to repo root):

`projects/campfire-vscode-extension/dist/campfire-storybuilder.vsix`

## Build and package (Windows, cmd.exe)

Run these commands from the extension directory. They assume Bun is installed and available on your PATH.

```cmd
cd C:\git\twine-campfire\projects\campfire-vscode-extension
bun install
bun run build
bun run package
```

Notes:

- The `package` script in `package.json` uses `bunx vsce package --no-dependencies --out dist/campfire-storybuilder.vsix` which will write the VSIX into `dist/`.
- If `vsce` is not available via `bunx`, you can install it globally (for example, `bunx npm:vsce` or `npm i -g vsce`) and re-run the `bun run package` step.

## Install the .vsix in Visual Studio Code

There are three common ways to install a local .vsix file:

1. Using the VS Code UI

- Open VS Code
- Open the Extensions view (Ctrl+Shift+X)
- Click the kebab menu (three dots) in the top-right, choose "Install from VSIX..."
- Select `campfire-storybuilder.vsix` from the `dist/` folder

2. Using the Command Palette

- Open Command Palette (Ctrl+Shift+P)
- Run: `Extensions: Install from VSIX...` and pick the `dist/campfire-storybuilder.vsix`

3. Using the VS Code CLI (recommended for automation)

```cmd
code --install-extension C:\git\twine-campfire\projects\campfire-vscode-extension\dist\campfire-storybuilder.vsix
```

To uninstall (by extension identifier):

```cmd
code --uninstall-extension campfire.campfire-storybuilder
```

(If the identifier above doesn't match your installed id, open the Extensions view in VS Code, find the extension, and copy the identifier shown under the extension name.)

## Tips

- If you make code changes, re-run `bun run build` before `bun run package`.
- The `package.json` includes a `prepackage` lifecycle that runs the build automatically when using `npm` lifecycle tooling; you can also add a combined script such as `dist-package` to run both build and package together.
- If you plan to distribute the extension, refer to the VS Code Marketplace publishing docs and ensure you bump the `version` in `package.json` before publishing.

---

If you'd like, I can:

- Add a `dist-package` npm script that runs the build and package in one command.
- Update repository CI to archive the generated `.vsix` as a build artifact.
