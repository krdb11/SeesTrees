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
    this.iconPath = fs.statSync(resourceUri.fsPath).isDirectory()
      ? new vscode.ThemeIcon('folder')
      : new vscode.ThemeIcon('file');
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

  getFilesAndFolders(dirPath: string): FileTreeItem[] {
    try {
      const children = fs.readdirSync(dirPath);
      return children
        .filter(name => !name.startsWith('.') && name !== 'node_modules' && name !== 'out')
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
    } catch {
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

	const disposable = vscode.commands.registerCommand('SeesTrees.helloWorld', () => {
		vscode.window.showInformationMessage('SeesTrees: Project tree visualization is ready!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
