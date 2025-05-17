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
    
    // Enhanced icon handling with file type detection
    this.updateIconAndLabel();
  }
  
  private updateIconAndLabel(): void {
    const filePath = this.resourceUri.fsPath;
    const isDirectory = fs.statSync(filePath).isDirectory();
    const extension = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);
    
    if (isDirectory) {
      // Folder icons with emojis
      this.iconPath = new vscode.ThemeIcon('folder');
      this.label = `📂 ${this.label}`;
      
      // Special folder handling
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
      // Special files handling first
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
      
      // File type detection with appropriate icons and emojis
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
    
    const ignorePatterns = [
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

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	// Output extension activation info
	console.log('SeesTrees extension is now active.');

  // Register the tree data provider for the view
  const treeDataProvider = new SeesTreesProvider();
  vscode.window.registerTreeDataProvider('seesTreesView', treeDataProvider);

	// Register the welcome/hello world command
	const helloDisposable = vscode.commands.registerCommand('seestrees.helloWorld', () => {
		vscode.window.showInformationMessage('SeesTrees: Project tree visualization is ready!');
	});

	// Register the refresh command
	const refreshDisposable = vscode.commands.registerCommand('seestrees.refresh', () => {
		treeDataProvider.refresh();
		vscode.window.showInformationMessage('SeesTrees: Tree view refreshed');
	});

	// Add both commands to subscriptions
	context.subscriptions.push(helloDisposable, refreshDisposable);
	
	// Activate the welcome message on first load
	vscode.commands.executeCommand('seestrees.helloWorld');
}

// This method is called when your extension is deactivated
export function deactivate() {}
