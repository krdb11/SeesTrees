# Change Log

All notable changes to the "SeesTrees" extension will be documented in this file.

## [0.1.2] - 2025-05-18

### Added
- Power Grid feature that visually indicates where interpreters have access paths
- Visual indicators for Python, Node.js, Docker, Ruby, Go, Java, and PHP environments
- Radiating glow effect that highlights directories containing environment configurations
- Inheritance of environment access throughout the directory tree
- Special indicators for files that have access to project environments

### Changed
- Enhanced tree view with power indicators showing environment access
- Improved tooltip information for directories with environment configurations

## [0.1.1] - 2025-05-17

### Fixed
- Fixed terminal display issue where tree output was being interpreted as commands
- Improved terminal visualization with proper shell escaping
- Added safeguards to ensure clean terminal output

## [0.1.0] - 2025-05-17

### Added
- User-configurable ignored file/folder patterns
- Command to add/remove ignored patterns through the UI
- Settings configuration for customizing which files to exclude
- Automatic refresh when ignored patterns are changed

## [0.0.9] - 2025-05-17

### Added
- Terminal tree display command that shows a colorful directory tree in the terminal
- Full directory tree visualization with connector lines and emojis
- Command available through Command Palette as "SeesTrees: Show Tree in Terminal"

## [0.0.8] - 2025-05-17

### Fixed
- Compatibility issues with VS Code types and engine requirements
- Command registration issues

### Added
- Enhanced file type detection with more comprehensive emoji mapping
- Improved sorting of files and folders in tree view
- Refresh command with button in tree view title

## [0.0.6] - 2025-05-15

- Initial release with basic tree visualization