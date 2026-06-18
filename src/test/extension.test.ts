import * as assert from 'assert';
import * as vscode from 'vscode';
import { getCwd } from '../extension';

suite('Extension Test Suite', () => {
	const commandIds = [
		'openTerminalHere.powershell',
		'openTerminalHere.wsl',
		'openTerminalHere.cmd'
	];

	test('registers all Open Terminal Here commands', async () => {
		const extension = vscode.extensions.all.find(
			(e) => e.packageJSON?.name === 'open-terminal-here'
		);
		assert.ok(extension, 'Expected the extension to be present');

		await extension.activate();

		const commands = await vscode.commands.getCommands(true);
		for (const id of commandIds) {
			assert.ok(commands.includes(id), `Expected command '${id}' to be registered`);
		}
	});

	test('getCwd returns the fsPath of the provided uri', () => {
		const uri = vscode.Uri.file('C:\\dev\\example');

		assert.strictEqual(getCwd(uri), uri.fsPath);
	});

	test('getCwd falls back to the first workspace folder when no uri is given', () => {
		const expected = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

		assert.strictEqual(getCwd(), expected);
	});
});
