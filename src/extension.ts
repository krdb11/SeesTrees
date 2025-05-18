import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// Environment markers for the power grid visualization
const EnvMarkers = {
  PYTHON_VENV: "🟢",    // Green circle for Python virtual environments
  PYTHON_POETRY: "🔵",  // Blue circle for Poetry environments
  NODE_ENV: "🟠",       // Orange circle for Node.js environments
  DOCKER_ENV: "🐳",     // Whale for Docker environments
  RUBY_ENV: "💎",       // Gem for Ruby environments
  GO_ENV: "🔹",         // Blue diamond for Go environments
  JAVA_ENV: "☕",       // Coffee for Java environments
  PHP_ENV: "🐘",        // Elephant for PHP environments
  POWER_SOURCE: "⚡",   // Lightning bolt for power source directories
  POWER_FLOW: "✨",     // Sparkles for power flow indicators
};

// Class to track detected environments for the power grid visualization
interface EnvInfo {
  type: string;
  marker: string;
  powerLevel: number;
}

class EnvironmentDetector {
  static detectEnvironments(directoryPath: string): Record<string, EnvInfo> {
    const environments: Record<string, EnvInfo> = {};
    
    // Python environment detection
    const pythonEnvType = this.detectPythonEnv(directoryPath);
    if (pythonEnvType) {
      environments['python'] = {
        type: pythonEnvType,
        marker: this.getPythonEnvMarker(pythonEnvType),
        powerLevel: 3,  // 1-5 scale of "power" for visual effect
      };
    }
    
    // Node.js environment detection
    if (this.detectNodeEnv(directoryPath)) {
      environments['node'] = {
        type: 'node',
        marker: EnvMarkers.NODE_ENV,
        powerLevel: 3,
      };
    }
    
    // Docker environment detection
    if (this.detectDockerEnv(directoryPath)) {
      environments['docker'] = {
        type: 'docker',
        marker: EnvMarkers.DOCKER_ENV,
        powerLevel: 4,
      };
    }
    
    // Ruby environment detection
    if (this.detectRubyEnv(directoryPath)) {
      environments['ruby'] = {
        type: 'ruby',
        marker: EnvMarkers.RUBY_ENV,
        powerLevel: 2,
      };
    }
    
    // Go environment detection
    if (this.detectGoEnv(directoryPath)) {
      environments['go'] = {
        type: 'go',
        marker: EnvMarkers.GO_ENV,
        powerLevel: 2,
      };
    }
    
    // Java/Maven/Gradle environment detection
    if (this.detectJavaEnv(directoryPath)) {
      environments['java'] = {
        type: 'java',
        marker: EnvMarkers.JAVA_ENV,
        powerLevel: 3,
      };
    }
    
    // PHP environment detection
    if (this.detectPhpEnv(directoryPath)) {
      environments['php'] = {
        type: 'php',
        marker: EnvMarkers.PHP_ENV,
        powerLevel: 2,
      };
    }
    
    return environments;
  }
  
  private static detectPythonEnv(directory: string): string | null {
    // Check for standard virtual environment
    if (fs.existsSync(path.join(directory, 'venv')) || 
        fs.existsSync(path.join(directory, 'env')) || 
        fs.existsSync(path.join(directory, '.venv'))) {
      return 'venv';
    }
    
    // Check for Poetry
    if (fs.existsSync(path.join(directory, 'pyproject.toml'))) {
      try {
        const content = fs.readFileSync(path.join(directory, 'pyproject.toml'), 'utf8');
        if (content.includes('[tool.poetry]')) {
          return 'poetry';
        }
      } catch (err) {
        // Ignore errors reading file
      }
    }
    
    // Check for requirements.txt as a fallback
    if (fs.existsSync(path.join(directory, 'requirements.txt'))) {
      return 'venv';
    }
    
    return null;
  }
  
  private static getPythonEnvMarker(envType: string): string {
    if (envType === 'venv') {
      return EnvMarkers.PYTHON_VENV;
    } else if (envType === 'poetry') {
      return EnvMarkers.PYTHON_POETRY;
    }
    return "";
  }
  
  private static detectNodeEnv(directory: string): boolean {
    return fs.existsSync(path.join(directory, 'package.json'));
  }
  
  private static detectDockerEnv(directory: string): boolean {
    return fs.existsSync(path.join(directory, 'Dockerfile')) || 
           fs.existsSync(path.join(directory, 'docker-compose.yml')) || 
           fs.existsSync(path.join(directory, 'docker-compose.yaml'));
  }
  
  private static detectRubyEnv(directory: string): boolean {
    return fs.existsSync(path.join(directory, 'Gemfile'));
  }
  
  private static detectGoEnv(directory: string): boolean {
    return fs.existsSync(path.join(directory, 'go.mod'));
  }
  
  private static detectJavaEnv(directory: string): boolean {
    return fs.existsSync(path.join(directory, 'pom.xml')) || 
           fs.existsSync(path.join(directory, 'build.gradle')) || 
           fs.existsSync(path.join(directory, 'build.gradle.kts'));
  }
  
  private static detectPhpEnv(directory: string): boolean {
    return fs.existsSync(path.join(directory, 'composer.json'));
  }
}

class FileTreeItem extends vscode.TreeItem {
  // Cache of detected environments by directory
  private static environmentCache: Map<string, Record<string, EnvInfo>> = new Map();
  
  // Parent environments for power grid inheritance
  private parentEnvironments: Record<string, EnvInfo> = {};
  
  // Current item's environments
  public environments: Record<string, EnvInfo> = {};
  
  // Combined power level
  public powerLevel: number = 0;
  
  constructor(
    public readonly resourceUri: vscode.Uri,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    parentEnvs?: Record<string, EnvInfo>
  ) {
    super(resourceUri, collapsibleState);
    this.label = path.basename(resourceUri.fsPath);
    this.resourceUri = resourceUri;
    this.collapsibleState = collapsibleState;
    this.contextValue = fs.statSync(resourceUri.fsPath).isDirectory() ? 'folder' : 'file';
    
    // Store parent environments for inheritance
    if (parentEnvs) {
      this.parentEnvironments = { ...parentEnvs };
    }
    
    // Detect environments in current directory if it's a directory
    if (fs.statSync(resourceUri.fsPath).isDirectory()) {
      this.detectEnvironments();
    }
    
    this.updateIconAndLabel();
  }
  
  private detectEnvironments(): void {
    const dirPath = this.resourceUri.fsPath;
    
    // Check if we already detected environments for this directory
    if (FileTreeItem.environmentCache.has(dirPath)) {
      this.environments = { ...FileTreeItem.environmentCache.get(dirPath)! };
    } else {
      // Detect environments and cache the result
      this.environments = EnvironmentDetector.detectEnvironments(dirPath);
      FileTreeItem.environmentCache.set(dirPath, { ...this.environments });
    }
    
    // Calculate power level based on detected environments
    if (Object.keys(this.environments).length > 0) {
      this.powerLevel = Math.max(...Object.values(this.environments).map(env => env.powerLevel));
    } else if (Object.keys(this.parentEnvironments).length > 0) {
      // Inherit but reduce power level from parent
      const parentPowerLevel = Math.max(
        ...Object.values(this.parentEnvironments).map(env => env.powerLevel)
      );
      this.powerLevel = Math.max(0, parentPowerLevel - 1);
    }
  }
  
  private updateIconAndLabel(): void {
    const filePath = this.resourceUri.fsPath;
    const isDirectory = fs.statSync(filePath).isDirectory();
    const extension = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);
    
    // Combine environments from current directory and inherited from parent
    const allEnvironments = { 
      ...this.parentEnvironments,
      ...this.environments 
    };
    
    // Generate environment indicator string
    const envIndicators = Object.values(allEnvironments)
      .map(env => env.marker)
      .join(" ");
    
    // Display the power level if present
    const powerIndicator = this.powerLevel > 0 ? 
      (this.environments && Object.keys(this.environments).length > 0 ? 
        EnvMarkers.POWER_SOURCE : 
        EnvMarkers.POWER_FLOW) :
      "";
    
    if (isDirectory) {
      this.iconPath = new vscode.ThemeIcon('folder');
      
      // Basic folder emoji
      let emoji = '📂';
      
      // Special folder types
      if (fileName.includes('src') || fileName.includes('source')) {
        emoji = '📦';
      } else if (fileName.includes('test')) {
        emoji = '🧪';
      } else if (fileName.includes('doc')) {
        emoji = '📚';
      } else if (fileName.includes('images') || fileName.includes('img')) {
        emoji = '🖼️';
      } else if (fileName.includes('data')) {
        emoji = '💾';
      } else if (fileName.includes('build') || fileName.includes('dist')) {
        emoji = '🏗️';
      }
      
      // Environment-specific folders
      if ((fileName === 'venv' || fileName === '.venv' || fileName === 'env') && 
          allEnvironments['python']) {
        emoji = EnvMarkers.PYTHON_VENV;
      } else if (fileName === 'node_modules' && allEnvironments['node']) {
        emoji = EnvMarkers.NODE_ENV;
      }
      
      // Set the label with power indicators if present
      this.label = `${emoji} ${fileName} ${powerIndicator} ${envIndicators}`.trimEnd();
      
      // Add tooltip with power grid information if present
      if (this.powerLevel > 0) {
        const envNames = Object.keys(this.environments);
        if (envNames.length > 0) {
          this.tooltip = `Power source for: ${envNames.join(', ')} environments`;
        } else {
          this.tooltip = `Powered by parent environment`;
        }
        
        // Add power grid icon to show this directory has environment access
        this.iconPath = new vscode.ThemeIcon('pulse');
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
        
        // Add power flow indicator for significant files
        const flowIndicator = (this.powerLevel > 0 && 
          (fileName === 'package.json' || fileName === 'pyproject.toml')) ? 
          EnvMarkers.POWER_FLOW : "";
          
        this.label = `${emoji} ${fileName} ${flowIndicator}`.trimEnd();
        
        if (flowIndicator) {
          this.tooltip = "Environment configuration file";
        }
        
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
      
      // Special handling for code files in powered environments
      const isPoweredCodeFile = this.powerLevel > 0 && 
        ['.py', '.js', '.ts', '.jsx', '.tsx'].includes(extension);
      
      if (fileTypes[extension]) {
        const { icon, emoji } = fileTypes[extension];
        this.iconPath = new vscode.ThemeIcon(icon);
        
        // Add power flow indicator for code files in powered directories
        const flowIndicator = isPoweredCodeFile ? EnvMarkers.POWER_FLOW : "";
        
        this.label = `${emoji} ${fileName} ${flowIndicator}`.trimEnd();
        
        if (isPoweredCodeFile) {
          this.tooltip = "File has access to project environment";
          
          // Highlight powered code files with special icon
          const envTypes = Object.keys(allEnvironments);
          if (extension === '.py' && envTypes.includes('python')) {
            this.iconPath = new vscode.ThemeIcon('symbol-class', new vscode.ThemeColor('charts.green'));
          } else if (['.js', '.jsx'].includes(extension) && envTypes.includes('node')) {
            this.iconPath = new vscode.ThemeIcon('javascript', new vscode.ThemeColor('charts.orange'));
          } else if (['.ts', '.tsx'].includes(extension) && envTypes.includes('node')) {
            this.iconPath = new vscode.ThemeIcon('typescript', new vscode.ThemeColor('charts.blue'));
          }
        }
      } else {
        this.iconPath = new vscode.ThemeIcon('file');
        this.label = `📄 ${fileName}`;
      }
    }
  }
  
  // Get environments to pass to child items
  public getAllEnvironments(): Record<string, EnvInfo> {
    return {
      ...this.parentEnvironments,
      ...this.environments
    };
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
    
    // If this is the root level, just get the files/folders
    if (!element) {
      return Promise.resolve(this.getFilesAndFolders(rootPath));
    }
    
    // Otherwise, pass parent environments to children
    const dirPath = element.resourceUri.fsPath;
    return Promise.resolve(this.getFilesAndFolders(dirPath, element.getAllEnvironments()));
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
  
  getFilesAndFolders(dirPath: string, parentEnvironments?: Record<string, EnvInfo>): FileTreeItem[] {
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
              : vscode.TreeItemCollapsibleState.None,
            parentEnvironments
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
    
    // Environment Power Grid colors
    pythonEnv: '\x1b[38;5;46m',  // Bright Green
    nodeEnv: '\x1b[38;5;214m',   // Bright Orange
    dockerEnv: '\x1b[38;5;33m',  // Bright Blue
    rubyEnv: '\x1b[38;5;196m',   // Ruby Red
    goEnv: '\x1b[38;5;75m',      // Go Blue
    javaEnv: '\x1b[38;5;166m',   // Java Orange
    phpEnv: '\x1b[38;5;105m',    // PHP Purple
    
    // Power grid glow effect
    glowStart: '\x1b[7m',        // Reverse video for background glow
    glowEnd: '\x1b[27m',         // End reverse
    blink: '\x1b[5m',            // Blinking text for power sources
    bold: '\x1b[1m',             // Bold for emphasis
    
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
  
  private static generatePowerGridEffect(powerLevel: number, text: string): string {
    if (powerLevel <= 0) {
      return text;
    }
    
    // Base glow intensity
    if (powerLevel === 1) {
      return `${this.colors.glowStart}${text}${this.colors.glowEnd}`;
    } else if (powerLevel === 2) {
      return `${this.colors.bold}${text}${this.colors.reset}`;
    } else if (powerLevel === 3) {
      return `${this.colors.bold}${this.colors.glowStart}${text}${this.colors.glowEnd}${this.colors.reset}`;
    } else if (powerLevel === 4) {
      return `${this.colors.bold}${this.colors.glowStart} ${text} ${this.colors.glowEnd}${this.colors.reset}`;
    } else { // powerLevel >= 5
      return `${this.colors.blink}${this.colors.bold}${this.colors.glowStart} ${text} ${this.colors.glowEnd}${this.colors.reset}`;
    }
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
    
    // Use echo with proper escaping to prevent shell interpretation
    terminal.sendText('clear'); // Clear the terminal first
    
    // Add a small delay to ensure the terminal is ready
    setTimeout(() => {
      try {
        // Print a header using echo to avoid shell interpretation
        terminal.sendText(`echo -e "\\n🌳 ${this.colors.folder}Project Structure${this.colors.reset}"`);
        terminal.sendText('echo -e "=================="');
        
        // Use our custom method that generates a temp file with the tree output
        this.printDirectoryTreeSafely(workspaceRoot, terminal);
      } catch (error) {
        terminal.sendText(`echo -e "⚠️ Error displaying tree: ${error instanceof Error ? error.message : String(error)}"`);
      }
    }, 100);
  }
  
  private static printDirectoryTreeSafely(workspaceRoot: string, terminal: vscode.Terminal): void {
    // Create a temporary file with the tree output
    const tempFilePath = path.join(os.tmpdir(), `seestrees-${Date.now()}.txt`);
    let output = '';
    
    const appendLine = (line: string) => {
      output += line + '\n';
    };
    
    // Track environments as we traverse the tree
    const envCache = new Map<string, Record<string, EnvInfo>>();
    
    const generateTree = (directory: string, prefix = "", isRoot = true, parentEnvs: Record<string, EnvInfo> = {}) => {
      try {
        // Detect environments in the current directory
        let currentEnvs: Record<string, EnvInfo> = {};
        
        // Check cache first
        if (envCache.has(directory)) {
          currentEnvs = { ...envCache.get(directory)! };
        } else {
          // Detect environments and cache them
          currentEnvs = EnvironmentDetector.detectEnvironments(directory);
          envCache.set(directory, { ...currentEnvs });
        }
        
        // Combine with parent environments (environment inheritance)
        const allEnvs = { ...parentEnvs };
        for (const [envName, envData] of Object.entries(currentEnvs)) {
          allEnvs[envName] = envData;
        }
        
        // Generate environment indicators
        const envIndicators: string[] = [];
        let maxPowerLevel = 0;
        
        for (const [envName, envData] of Object.entries(allEnvs)) {
          const marker = envData.marker;
          const color = this.colors.pythonEnv; // Simplified for example
          maxPowerLevel = Math.max(maxPowerLevel, envData.powerLevel);
          envIndicators.push(`${color}${marker}${this.colors.reset}`);
        }
        
        const envIndicatorStr = envIndicators.length > 0 ? envIndicators.join(" ") : "";
        
        if (isRoot) {
          appendLine(`\n🌳 ${this.colors.folder}Project Structure${this.colors.reset}  ${envIndicatorStr}`);
          appendLine("==================");
          
          // Print root config files first
          const rootFiles = fs.readdirSync(directory)
            .filter(file => 
              fs.statSync(path.join(directory, file)).isFile() && 
              !this.shouldIgnore(path.join(directory, file))
            )
            .sort();
          
          // Add power grid indicator for root
          const powerGrid = maxPowerLevel > 0 ? EnvMarkers.POWER_SOURCE : "";
          const powerFlow = maxPowerLevel > 0 ? EnvMarkers.POWER_FLOW : "";
          
          for (const file of rootFiles) {
            const [color, emoji] = this.getFileColorAndEmoji(file);
            if (maxPowerLevel > 0) {
              // Add power grid glow effect
              const fileDisplay = this.generatePowerGridEffect(
                1, `${emoji} ${color}${file}${this.colors.reset}`
              );
              appendLine(`├── ${fileDisplay} ${powerFlow}`);
            } else {
              appendLine(`├── ${emoji} ${color}${file}${this.colors.reset}`);
            }
          }
          
          appendLine("│");
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

            // Special folder types
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
          
          // Check if this directory has its own environments
          let dirEnvs: Record<string, EnvInfo> = {};
          if (fs.statSync(itemPath).isDirectory()) {
            if (envCache.has(itemPath)) {
              dirEnvs = { ...envCache.get(itemPath)! };
            } else {
              dirEnvs = EnvironmentDetector.detectEnvironments(itemPath);
              envCache.set(itemPath, { ...dirEnvs });
            }
          }
          
          const itemEnvIndicators: string[] = [];
          for (const [envName, envData] of Object.entries(dirEnvs)) {
            const marker = envData.marker;
            const envColor = this.colors.pythonEnv; // Simplified for example
            itemEnvIndicators.push(`${envColor}${marker}${this.colors.reset}`);
          }
          
          const itemEnvIndicatorStr = itemEnvIndicators.length > 0 ? 
            itemEnvIndicators.join(" ") : "";
          
          // Power grid visualization
          if (fs.statSync(itemPath).isDirectory() && 
              (Object.keys(dirEnvs).length > 0 || maxPowerLevel > 0)) {
            // Directory has environment power or inherits from parent
            const dirPowerLevel = Object.keys(dirEnvs).length > 0 ?
              Math.max(...Object.values(dirEnvs).map(env => env.powerLevel), 0) : 0;
            
            // Environment power source directories get enhanced visualization
            if (dirPowerLevel > 0) {
              // This dir introduces a new environment power source
              const powerIndicator = EnvMarkers.POWER_SOURCE;
              const itemDisplay = this.generatePowerGridEffect(
                dirPowerLevel, 
                `${emoji} ${color}${item}${this.colors.reset}`
              );
              appendLine(`${prefix}${connector}${itemDisplay} ${powerIndicator} ${itemEnvIndicatorStr}`);
            } else {
              // This dir inherits power from parent
              const inheritedPower = Math.min(maxPowerLevel - 1, 3); // Power diminishes with distance
              if (inheritedPower > 0) {
                const powerIndicator = EnvMarkers.POWER_FLOW;
                const itemDisplay = this.generatePowerGridEffect(
                  inheritedPower,
                  `${emoji} ${color}${item}${this.colors.reset}`
                );
                appendLine(`${prefix}${connector}${itemDisplay} ${powerIndicator} ${itemEnvIndicatorStr}`);
              } else {
                appendLine(`${prefix}${connector}${emoji} ${color}${item}${this.colors.reset} ${itemEnvIndicatorStr}`);
              }
            }
          } else {
            // Regular file or directory without environment power
            if (maxPowerLevel > 0 && ['.py', '.js', '.ts', '.jsx', '.tsx'].some(ext => item.endsWith(ext))) {
              // Code files in powered environments get a power flow indicator
              const flowLevel = Math.max(1, maxPowerLevel - 2); // Code files get less intense glow
              const itemDisplay = this.generatePowerGridEffect(
                flowLevel,
                `${emoji} ${color}${item}${this.colors.reset}`
              );
              appendLine(`${prefix}${connector}${itemDisplay} ${EnvMarkers.POWER_FLOW}`);
            } else {
              appendLine(`${prefix}${connector}${emoji} ${color}${item}${this.colors.reset}`);
            }
          }
          
          if (fs.statSync(itemPath).isDirectory()) {
            // Pass down environment information to child directories
            generateTree(itemPath, prefix + nextPrefix, false, allEnvs);
          }
        }
      } catch (error) {
        appendLine(`${prefix} ⚠️ [Error: ${error instanceof Error ? error.message : String(error)}]`);
      }
    };
    
    generateTree(workspaceRoot);
    
    // Write the output to a temporary file
    fs.writeFileSync(tempFilePath, output);
    
    // Display the tree using cat which prevents shell interpretation
    terminal.sendText(`cat "${tempFilePath}" && rm "${tempFilePath}"`);
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
  
  // Power Grid toggle command
  const togglePowerGridDisposable = vscode.commands.registerCommand('seestrees.togglePowerGrid', () => {
    const config = vscode.workspace.getConfiguration('seestrees');
    const currentStatus = config.get<boolean>('powerGrid.enabled');
    
    // Toggle the setting
    config.update('powerGrid.enabled', !currentStatus, vscode.ConfigurationTarget.Global)
      .then(() => {
        treeDataProvider.refresh();
        vscode.window.showInformationMessage(
          `SeesTrees: Power Grid visualization ${!currentStatus ? 'enabled' : 'disabled'}`
        );
      });
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
    configureIgnoredPatternsDisposable,
    togglePowerGridDisposable
  );
	
	vscode.commands.executeCommand('seestrees.helloWorld');
}

export function deactivate() {}
