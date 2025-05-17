# SeesTrees

SeesTrees is a Visual Studio Code extension that provides a visually enhanced, color-coded, and emoji-rich tree view of your project directory structure. Instantly understand your project's hierarchy at a glance, right from the terminal or command palette.

## Features
- Beautiful tree view of your project structure
- Color coding for file types (Python, JS, configs, docs, images, etc.)
- Emojis for instant file/folder recognition
- Ignores clutter (e.g., .git, node_modules, build artifacts)
- Terminal command for displaying a colorful directory tree with connector lines
- Easy to use from the command palette or terminal

![SeesTrees Example](./images/seesTreesExample.png)

## Requirements
- Visual Studio Code 1.100.0 or higher
- No additional dependencies

## Extension Settings
This extension does not add any custom settings. All configuration is automatic and based on common project conventions.

## Known Issues
- Large projects may take longer to render
- Permission errors on restricted folders are gracefully handled

## Usage

### Tree View
The extension adds a new tree view to your VS Code explorer panel labeled "SeesTrees". Click on it to see your project structure with color-coded emojis.

### Terminal Tree Display
Run the command "SeesTrees: Show Tree in Terminal" from the Command Palette (Ctrl+Shift+P) to display a colorful directory tree in the terminal, complete with connector lines and emojis.

### Customizing Ignored Files and Folders
You can customize which files and folders are ignored in the tree view:

1. From the Command Palette (Ctrl+Shift+P), select "SeesTrees: Configure Ignored Files/Folders"
2. Choose to add new patterns, remove existing ones, or restore defaults
3. The tree will automatically update with your new settings

Alternatively, you can edit the settings directly in VS Code settings:
1. Open VS Code settings (File > Preferences > Settings or Ctrl+,)
2. Search for "seestrees.ignoredPatterns"
3. Edit the array of patterns to ignore

## Contributing
Contributions and feedback are welcome! Please open an issue or pull request on the project repository.

## License
MIT


## Release notes moved to --> CHANGELOG.md