# Change Log

All notable changes to the "open-terminal-here" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

Initial release.

### Added

- Cross-platform shell detection (Windows, macOS, Linux) — only installed shells are shown in the submenu.
- Support for PowerShell 7 (`pwsh`), Git Bash, Zsh, Bash, Fish, and sh, in addition to PowerShell, Command Prompt, and WSL.
- WSL is offered only when at least one distribution is installed.
- An **Open Terminal Here: Refresh Available Shells** command to re-scan installed shells.
- Grouped the terminal commands under an **Open Terminal Here** submenu in the Explorer context menu.

### Changed

- The extension now activates on startup to detect available shells and is no longer Windows-only.
- Resolve Windows shell executables from `%SystemRoot%` instead of hardcoded `C:\Windows` paths.
- Corrected the extension description and display name.

### Fixed

- Show a clear error message when a shell is unavailable, instead of opening a broken terminal.