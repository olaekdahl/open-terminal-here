# Open Terminal Here

Open a terminal directly from the Explorer context menu in VS Code, using the folder you clicked as the working directory.

## Features

- Adds right-click Explorer actions to open:
	- PowerShell
	- WSL
	- Command Prompt (CMD)
- Uses the selected folder/file path as the terminal start location.
- If no path is provided, falls back to the first workspace folder.

## Commands

This extension contributes the following commands:

- `Open PowerShell Here` (`openTerminalHere.powershell`)
- `Open WSL Here` (`openTerminalHere.wsl`)
- `Open Command Prompt Here` (`openTerminalHere.cmd`)

These commands are available from the Explorer context menu.

## Requirements

- Windows OS
- Visual Studio Code 1.120.0 or newer
- For `Open WSL Here`: WSL must be installed and available (`wsl.exe`)

## How It Works

- PowerShell starts with `powershell.exe` and sets `cwd` to the selected path.
- CMD starts with `cmd.exe` and sets `cwd` to the selected path.
- WSL starts with `wsl.exe` and passes `--cd <path>` when a path is available.

## Extension Settings

This extension currently does not contribute any user settings.

## Known Issues

- The extension currently uses fixed Windows shell paths. If those executables are missing or relocated, the terminal may fail to start.
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
