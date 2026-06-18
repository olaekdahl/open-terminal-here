import * as assert from 'assert';
import * as vscode from 'vscode';
import { getCwd } from '../extension';
import { shellDefs } from '../shells';

suite('Extension Test Suite', () => {
	test('registers a command for every shell plus refresh', async () => {
		const extension = vscode.extensions.all.find(
			(e) => e.packageJSON?.name === 'open-terminal-here'
		);
		assert.ok(extension, 'Expected the extension to be present');

		await extension.activate();

		const commands = await vscode.commands.getCommands(true);
		for (const def of shellDefs) {
			assert.ok(
				commands.includes(def.commandId),
				`Expected command '${def.commandId}' to be registered`
			);
		}
		assert.ok(
			commands.includes('openTerminalHere.refresh'),
			'Expected the refresh command to be registered'
		);
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
