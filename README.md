# Shell Yeah!

Open a terminal directly from the Explorer context menu in VS Code, using the folder you clicked as the working directory. The extension detects the shells installed on your machine — across Windows, macOS, and Linux — and only offers the ones that are actually available.

## Features

- Adds a **Shell Yeah!** submenu to the Explorer context menu.
- Detects the shells installed on the current machine and only shows those that are available:
	- **Windows:** PowerShell, PowerShell 7 (`pwsh`), Command Prompt, Git Bash, WSL
	- **macOS / Linux:** Zsh, Bash, Fish, sh, PowerShell 7 (`pwsh`)
- WSL is offered only when at least one WSL distribution is installed.
- Uses the selected folder/file path as the terminal start location; falls back to the first workspace folder.
- Includes a **Shell Yeah!: Refresh Available Shells** command to re-scan after installing or removing a shell.

## Commands

Each supported shell contributes an "Open … Here" command — for example `Open PowerShell Here`, `Open Bash Here`, or `Open WSL Here`. These appear in the **Shell Yeah!** submenu in the Explorer context menu, and each one is shown only when its shell is detected.

- `Shell Yeah!: Refresh Available Shells` (`openTerminalHere.refresh`) — re-detect the installed shells.

## Requirements

- Visual Studio Code 1.120.0 or newer
- At least one supported shell installed (most systems include one by default)
- For `Open WSL Here` (Windows): WSL with at least one installed distribution (`wsl.exe`)

## How It Works

- On startup the extension scans for installed shells using known install locations, your `PATH`, and `/etc/shells` (macOS/Linux), then shows only the shells it finds.
- Windows shell executables are resolved from `%SystemRoot%` (falling back to `C:\Windows`), so a non-default Windows install location is handled correctly.
- WSL availability is confirmed by checking for an installed distribution (`wsl --list --quiet`).
- Each shell launches from a resolved absolute path with the selected folder as the working directory; WSL receives `--cd <path>`.
- If a shell can no longer be found when invoked, an error message is shown instead of opening a broken terminal.

## Extension Settings

This extension currently does not contribute any user settings.

## Known Issues

- Shells are detected when VS Code starts. After installing or removing a shell, run **Shell Yeah!: Refresh Available Shells** (or reload the window).
- WSL path translation depends on how `wsl.exe --cd` handles the provided path.

## Development

Install dependencies:

```bash
npm install
```

Compile:

```bash
npm run compile
```

Watch mode:

```bash
npm run watch
```

Lint:

```bash
npm run lint
```

Run tests:

```bash
npm test
```

Run the extension in development:

1. Open this project in VS Code.
2. Press `F5` to launch an Extension Development Host window.
3. In the new window, right-click a file or folder in Explorer and run one of the "Open ... Here" commands.

## Release Notes

See `CHANGELOG.md` for release history.
