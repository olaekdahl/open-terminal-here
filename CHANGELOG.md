# Change Log

All notable changes to the "open-terminal-here" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

Initial release.

### Added

- Grouped the terminal commands under an **Open Terminal Here** submenu in the Explorer context menu.

### Changed

- Resolve Windows shell executables from `%SystemRoot%` instead of hardcoded `C:\Windows` paths.
- Corrected the extension description and display name.

### Fixed

- Show a clear error message when a shell executable is missing or when invoked on a non-Windows OS, instead of opening a broken terminal.