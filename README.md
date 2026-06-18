# Open Terminal Here

Open a terminal directly from the Explorer context menu in VS Code, using the folder you clicked as the working directory.

## Features

- Adds an **Open Terminal Here** submenu to the Explorer context menu, with actions to open:
	- PowerShell
	- WSL
	- Command Prompt (CMD)
- Uses the selected folder/file path as the terminal start location.
- If no path is provided, falls back to the first workspace folder.
- Only shown on Windows.

## Commands

This extension contributes the following commands:

- `Open PowerShell Here` (`openTerminalHere.powershell`)
- `Open WSL Here` (`openTerminalHere.wsl`)
- `Open Command Prompt Here` (`openTerminalHere.cmd`)

These commands are available from the **Open Terminal Here** submenu in the Explorer context menu.

## Requirements

- Windows OS
- Visual Studio Code 1.120.0 or newer
- For `Open WSL Here`: WSL must be installed and available (`wsl.exe`)

## How It Works

- Shell executables are resolved from `%SystemRoot%` (falling back to `C:\Windows`), so a non-default Windows install location is handled correctly.
- PowerShell starts with `powershell.exe` and sets `cwd` to the selected path.
- CMD starts with `cmd.exe` and sets `cwd` to the selected path.
- WSL starts with `wsl.exe` and passes `--cd <path>` when a path is available.
- If a shell executable cannot be found, an error message is shown instead of opening a broken terminal.

## Extension Settings

This extension currently does not contribute any user settings.

## Known Issues

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
