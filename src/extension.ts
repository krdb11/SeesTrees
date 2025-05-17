import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

class FileTreeItem extends vscode.TreeItem {
  constructor(
    public readonly resourceUri: vscode.Uri,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(resourceUri, collapsibleState);
    this.label = path.basename(resourceUri.fsPath);
    this.resourceUri = resourceUri;
    this.collapsibleState = collapsibleState;
    this.contextValue = fs.statSync(resourceUri.fsPath).isDirectory() ? 'folder' : 'file';
    
    this.updateIconAndLabel();
  }
  
  private updateIconAndLabel(): void {
    const filePath = this.resourceUri.fsPath;
    const isDirectory = fs.statSync(filePath).isDirectory();
    const extension = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);
    
    if (isDirectory) {
      this.iconPath = new vscode.ThemeIcon('folder');
      this.label = `📂 ${this.label}`;
      
      if (this.label.includes('src') || this.label.includes('source')) {
        this.label = `📦 ${this.label}`;
      } else if (this.label.includes('test')) {
        this.label = `🧪 ${this.label}`;
      } else if (this.label.includes('doc')) {
        this.label = `📚 ${this.label}`;
      } else if (this.label.includes('images') || this.label.includes('img')) {
        this.label = `🖼️ ${this.label}`;
      } else if (this.label.includes('data')) {
        this.label = `💾 ${this.label}`;
      } else if (this.label.includes('build') || this.label.includes('dist')) {
        this.label = `🏗️ ${this.label}`;
      }
    } else {
      const specialFiles: Record<string, [vscode.ThemeIcon, string]> = {
        'package.json': [new vscode.ThemeIcon('package'), '📦'],
        'package-lock.json': [new vscode.ThemeIcon('lock'), '🔒'],
        'pyproject.toml': [new vscode.ThemeIcon('symbol-class'), '🐍'],
        'poetry.lock': [new vscode.ThemeIcon('lock'), '🔒'],
        '.gitignore': [new vscode.ThemeIcon('git'), '👁️'],
        '.env': [new vscode.ThemeIcon('settings'), '⚙️'],
      };

      if (specialFiles[fileName]) {
        const [icon, emoji] = specialFiles[fileName];
        this.iconPath = icon;
        this.label = `${emoji} ${this.label}`;
        return;
      }
      
      interface FileTypeConfig {
        icon: string;
        emoji: string;
      }
      
      const fileTypes: Record<string, FileTypeConfig> = {
        // Programmatic
        '.py': { icon: 'symbol-class', emoji: '🐍' },
        '.js': { icon: 'javascript', emoji: '📜' },
        '.jsx': { icon: 'react', emoji: '⚛️' },
        '.ts': { icon: 'typescript', emoji: '💠' },
        '.tsx': { icon: 'react', emoji: '⚛️' },
        
        // Web
        '.html': { icon: 'html', emoji: '🌐' },
        '.css': { icon: 'css', emoji: '🎨' },
        
        // Data
        '.json': { icon: 'json', emoji: '📋' },
        '.yaml': { icon: 'yaml', emoji: '📋' },
        '.yml': { icon: 'yaml', emoji: '📋' },
        '.sql': { icon: 'database', emoji: '💾' },
        '.csv': { icon: 'file-binary', emoji: '📊' },
        
        // Configuration
        '.toml': { icon: 'settings-gear', emoji: '⚙️' },
        '.env': { icon: 'settings-gear', emoji: '⚙️' },
        '.lock': { icon: 'lock', emoji: '🔒' },
        
        // Documentation
        '.md': { icon: 'markdown', emoji: '📝' },
        '.txt': { icon: 'file-text', emoji: '📝' },
        '.rst': { icon: 'file-text', emoji: '📝' },
        
        // Images
        '.png': { icon: 'image', emoji: '🖼️' },
        '.jpg': { icon: 'image', emoji: '🖼️' },
        '.jpeg': { icon: 'image', emoji: '🖼️' },
        '.gif': { icon: 'image', emoji: '🖼️' },
        '.svg': { icon: 'image', emoji: '🖼️' },
      };
      
      if (fileTypes[extension]) {
        const { icon, emoji } = fileTypes[extension];
        this.iconPath = new vscode.ThemeIcon(icon);
        this.label = `${emoji} ${this.label}`;
      } else {
        this.iconPath = new vscode.ThemeIcon('file');
        this.label = `📄 ${this.label}`;
      }
    }
  }
}

class SeesTreesProvider implements vscode.TreeDataProvider<FileTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<FileTreeItem | undefined | void> = new vscode.EventEmitter<FileTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<FileTreeItem | undefined | void> = this._onDidChangeTreeData.event;

  private readonly config = vscode.workspace.getConfiguration('seestrees');
  
  constructor() {
    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('seestrees.ignoredPatterns')) {
        this.refresh();
      }
    });
  }

  getTreeItem(element: FileTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: FileTreeItem): Thenable<FileTreeItem[]> {
    const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!rootPath) {
      return Promise.resolve([]);
    }
    const dirPath = element ? element.resourceUri.fsPath : rootPath;
    return Promise.resolve(this.getFilesAndFolders(dirPath));
  }

  shouldIgnore(filePath: string): boolean {
    const name = path.basename(filePath);
    
    // Get user-configured ignored patterns
    const ignorePatterns = this.config.get<string[]>('ignoredPatterns') || [
      '.git', '__pycache__', 'node_modules',
      '.vscode', '.idea', '.DS_Store',
      'venv', 'env', 'build', 'dist', 
      '.pyc', '.egg-info'
    ];
    
    return ignorePatterns.some(pattern => {
      if (pattern.startsWith('.') && pattern.length > 1) {
        // Handle file extensions like '.pyc'
        return name.endsWith(pattern);
      } else {
        // Handle directory/file names
        return name === pattern;
      }
    });
  }
  
  getFilesAndFolders(dirPath: string): FileTreeItem[] {
    try {
      const children = fs.readdirSync(dirPath);
      
      // Sort items: directories first, then files, both alphabetically
      const sortedItems = children
        .filter(name => !this.shouldIgnore(path.join(dirPath, name)))
        .sort((a, b) => {
          const aIsDir = fs.statSync(path.join(dirPath, a)).isDirectory();
          const bIsDir = fs.statSync(path.join(dirPath, b)).isDirectory();
          
          if (aIsDir && !bIsDir) { return -1; }
          if (!aIsDir && bIsDir) { return 1; }
          return a.localeCompare(b);
        })
        .map(name => {
          const fullPath = path.join(dirPath, name);
          const stat = fs.statSync(fullPath);
          return new FileTreeItem(
            vscode.Uri.file(fullPath),
            stat.isDirectory()
              ? vscode.TreeItemCollapsibleState.Collapsed
              : vscode.TreeItemCollapsibleState.None
          );
        });
        
      return sortedItems;
    } catch (err) {
      console.error(`Error accessing directory ${dirPath}:`, err);
      return [];
    }
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}

/**
 * Terminal tree visualization functions
 */
class TerminalTreeVisualizer {
  private static terminal: vscode.Terminal | undefined;
  
  private static colors = {
    folder: '\x1b[1;34m',        // Bold Blue
    config: '\x1b[1;33m',        // Bold Yellow
    python: '\x1b[1;32m',        // Bold Green
    docs: '\x1b[1;36m',          // Bold Cyan
    json: '\x1b[1;35m',          // Bold Magenta
    lock: '\x1b[1;31m',          // Bold Red
    image: '\x1b[38;5;213m',     // Pink
    npm: '\x1b[38;5;208m',       // Orange
    html: '\x1b[38;5;202m',      // Deep Orange
    css: '\x1b[38;5;39m',        // Light Blue
    js: '\x1b[38;5;220m',        // Gold
    ts: '\x1b[38;5;45m',         // Turquoise
    yaml: '\x1b[38;5;177m',      // Purple
    sql: '\x1b[38;5;147m',       // Light Purple
    csv: '\x1b[38;5;107m',       // Olive
    reset: '\x1b[0m',            // Reset color
  };

  private static getFileColorAndEmoji(filePath: string): [string, string] {
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    // Default
    let color = this.colors.reset;
    let emoji = '📄';
    
    const specialFiles: Record<string, [string, string]> = {
      'package.json': [this.colors.npm, '📦'],
      'package-lock.json': [this.colors.lock, '🔒'],
      'pyproject.toml': [this.colors.python, '🐍'],
      'poetry.lock': [this.colors.lock, '🔒'],
      '.gitignore': [this.colors.config, '👁️'],
      '.env': [this.colors.config, '⚙️'],
    };
    
    if (specialFiles[fileName]) {
      return specialFiles[fileName];
    }
    
    const fileTypes: Record<string, [string, string]> = {
      // Programmatic
      '.py': [this.colors.python, '🐍'],
      '.js': [this.colors.js, '📜'],
      '.jsx': [this.colors.js, '⚛️'],
      '.ts': [this.colors.ts, '💠'],
      '.tsx': [this.colors.ts, '⚛️'],
      
      // Web
      '.html': [this.colors.html, '🌐'],
      '.css': [this.colors.css, '🎨'],
      
      // Data
      '.json': [this.colors.json, '📋'],
      '.yaml': [this.colors.yaml, '📋'],
      '.yml': [this.colors.yaml, '📋'],
      '.sql': [this.colors.sql, '💾'],
      '.csv': [this.colors.csv, '📊'],
      
      // Configuration
      '.toml': [this.colors.config, '⚙️'],
      '.env': [this.colors.config, '⚙️'],
      '.lock': [this.colors.lock, '🔒'],
      
      // Documentation
      '.md': [this.colors.docs, '📝'],
      '.txt': [this.colors.docs, '📝'],
      '.rst': [this.colors.docs, '📝'],
      
      // Images
      '.png': [this.colors.image, '🖼️'],
      '.jpg': [this.colors.image, '🖼️'],
      '.jpeg': [this.colors.image, '🖼️'],
      '.gif': [this.colors.image, '🖼️'],
      '.svg': [this.colors.image, '🖼️'],
    };
    
    if (fileTypes[ext]) {
      return fileTypes[ext];
    }
    
    return [color, emoji];
  }
  
  private static shouldIgnore(filePath: string): boolean {
    const name = path.basename(filePath);
    
    // Get user-configured ignored patterns
    const config = vscode.workspace.getConfiguration('seestrees');
    const ignorePatterns = config.get<string[]>('ignoredPatterns') || [
      '.git', '__pycache__', 'node_modules',
      '.vscode', '.idea', '.DS_Store',
      'venv', 'env', 'build', 'dist', 
      '.pyc', '.egg-info'
    ];
    
    return ignorePatterns.some(pattern => {
      if (pattern.startsWith('.') && pattern.length > 1) {
        // Handle file extensions like '.pyc'
        return name.endsWith(pattern);
      } else {
        // Handle directory/file names
        return name === pattern;
      }
    });
  }
  
  private static getTerminal(): vscode.Terminal {
    if (!this.terminal || this.terminal.exitStatus !== undefined) {
      this.terminal = vscode.window.createTerminal('SeesTrees');
    }
    return this.terminal;
  }
  
  private static printDirectoryTree(
    directory: string, 
    terminal: vscode.Terminal,
    prefix = "",
    isRoot = true
  ): void {
    try {
      if (isRoot) {
        terminal.sendText(`\n🌳 ${this.colors.folder}Project Structure${this.colors.reset}`);
        terminal.sendText("==================");
        
        const rootFiles = fs.readdirSync(directory)
          .filter(file => 
            fs.statSync(path.join(directory, file)).isFile() && 
            !this.shouldIgnore(path.join(directory, file))
          )
          .sort();
        
        for (const file of rootFiles) {
          const [color, emoji] = this.getFileColorAndEmoji(file);
          terminal.sendText(`├── ${emoji} ${color}${file}${this.colors.reset}`);
        }
        terminal.sendText("│");
      }
      
      const items = fs.readdirSync(directory)
        .filter(item => 
          !this.shouldIgnore(path.join(directory, item)) && 
          (!isRoot || fs.statSync(path.join(directory, item)).isDirectory())
        )
        .sort((a, b) => {
          const aIsDir = fs.statSync(path.join(directory, a)).isDirectory();
          const bIsDir = fs.statSync(path.join(directory, b)).isDirectory();
          
          if (aIsDir && !bIsDir) { return -1; }
          if (!aIsDir && bIsDir) { return 1; }
          return a.localeCompare(b);
        });
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const isLast = (i === items.length - 1);
        const connector = isLast ? "└── " : "├── ";
        const nextPrefix = isLast ? "    " : "│   ";
        
        const itemPath = path.join(directory, item);
        
        let color = this.colors.reset;
        let emoji = '📄';
        
        if (fs.statSync(itemPath).isDirectory()) {
          color = this.colors.folder;
          emoji = "📂";

          if (item.includes('src') || item.includes('source')) {
            emoji = "📦";
          } else if (item.includes('test')) {
            emoji = "🧪";
          } else if (item.includes('doc')) {
            emoji = "📚";
          } else if (item.includes('images') || item.includes('img')) {
            emoji = "🖼️";
          } else if (item.includes('data')) {
            emoji = "💾";
          } else if (item.includes('build') || item.includes('dist')) {
            emoji = "🏗️";
          }
        } else {
          [color, emoji] = this.getFileColorAndEmoji(itemPath);
        }
        
        terminal.sendText(`${prefix}${connector}${emoji} ${color}${item}${this.colors.reset}`);
        
        if (fs.statSync(itemPath).isDirectory()) {
          this.printDirectoryTree(itemPath, terminal, prefix + nextPrefix, false);
        }
      }
    } catch (error) {
      terminal.sendText(`${prefix} ⚠️ [Error: ${error instanceof Error ? error.message : String(error)}]`);
    }
  }
  
  public static showTreeInTerminal(workspaceRoot: string | undefined): void {
    if (!workspaceRoot) {
      vscode.window.showErrorMessage('SeesTrees: No workspace folder is open');
      return;
    }
    
    const terminal = this.getTerminal();
    terminal.show();
    terminal.sendText('clear'); // Clear the terminal first
    
    try {
      this.printDirectoryTree(workspaceRoot, terminal);
    } catch (error) {
      terminal.sendText(`⚠️ Error displaying tree: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export function activate(context: vscode.ExtensionContext) {
	console.log('SeesTrees extension is now active.');

  const treeDataProvider = new SeesTreesProvider();
  vscode.window.registerTreeDataProvider('seesTreesView', treeDataProvider);

	const helloDisposable = vscode.commands.registerCommand('seestrees.helloWorld', () => {
		vscode.window.showInformationMessage('SeesTrees: Project tree visualization is ready!');
	});

	const refreshDisposable = vscode.commands.registerCommand('seestrees.refresh', () => {
		treeDataProvider.refresh();
		vscode.window.showInformationMessage('SeesTrees: Tree view refreshed');
	});
  
  const terminalTreeDisposable = vscode.commands.registerCommand('seestrees.showTreeInTerminal', () => {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    TerminalTreeVisualizer.showTreeInTerminal(workspaceRoot);
    vscode.window.showInformationMessage('SeesTrees: Directory tree displayed in terminal');
  });
  
  const configureIgnoredPatternsDisposable = vscode.commands.registerCommand('seestrees.configureIgnoredPatterns', async () => {
    const config = vscode.workspace.getConfiguration('seestrees');
    const currentPatterns = config.get<string[]>('ignoredPatterns') || [];
    
    const options = ['Add new pattern', 'Remove existing pattern', 'Restore defaults', 'Cancel'];
    const selection = await vscode.window.showQuickPick(options, {
      placeHolder: 'What would you like to do with ignored patterns?'
    });
    
    if (selection === 'Add new pattern') {
      const newPattern = await vscode.window.showInputBox({
        placeHolder: 'Enter folder/file name or extension (e.g., "node_modules" or ".pyc")',
        prompt: 'Pattern to ignore in the tree view'
      });
      
      if (newPattern) {
        if (!currentPatterns.includes(newPattern)) {
          await config.update('ignoredPatterns', [...currentPatterns, newPattern], vscode.ConfigurationTarget.Global);
          vscode.window.showInformationMessage(`Added "${newPattern}" to ignored patterns`);
          treeDataProvider.refresh();
        } else {
          vscode.window.showInformationMessage(`"${newPattern}" is already in ignored patterns`);
        }
      }
    } else if (selection === 'Remove existing pattern') {
      if (currentPatterns.length === 0) {
        vscode.window.showInformationMessage('No patterns to remove');
        return;
      }
      
      const patternToRemove = await vscode.window.showQuickPick(currentPatterns, {
        placeHolder: 'Select pattern to remove'
      });
      
      if (patternToRemove) {
        await config.update(
          'ignoredPatterns', 
          currentPatterns.filter(p => p !== patternToRemove), 
          vscode.ConfigurationTarget.Global
        );
        vscode.window.showInformationMessage(`Removed "${patternToRemove}" from ignored patterns`);
        treeDataProvider.refresh();
      }
    } else if (selection === 'Restore defaults') {
      await config.update('ignoredPatterns', undefined, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage('Restored default ignored patterns');
      treeDataProvider.refresh();
    }
  });

	context.subscriptions.push(
    helloDisposable, 
    refreshDisposable, 
    terminalTreeDisposable,
    configureIgnoredPatternsDisposable
  );
	
	vscode.commands.executeCommand('seestrees.helloWorld');
}

export function deactivate() {}
