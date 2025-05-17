import * as vscode from 'vscode';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	// Output extension activation info
	console.log('SeesTrees extension is now active.');

	const disposable = vscode.commands.registerCommand('SeesTrees.helloWorld', () => {
		vscode.window.showInformationMessage('SeesTrees: Project tree visualization is ready!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
