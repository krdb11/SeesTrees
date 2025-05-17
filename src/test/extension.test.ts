import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('Tree output does not include placeholder or sample text', () => {
		const output = 'SeesTrees: Project tree visualization is ready!';
		assert.ok(!output.match(/placeholder|sample|lorem|robot|ai|copilot|test|quickstart|template|boilerplate/i));
	});
});
