import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
	firstExisting,
	getAvailableShells,
	readEtcShells,
	shellDefs,
	which
} from '../shells';

suite('Shell detection Test Suite', () => {
	test('which resolves a ubiquitous executable to an absolute path', () => {
		const exe = process.platform === 'win32' ? 'cmd.exe' : 'sh';
		const found = which(exe);

		assert.ok(found, `Expected to resolve '${exe}' on PATH`);
		assert.ok(path.isAbsolute(found), 'Expected an absolute path');
	});

	test('which returns undefined for a non-existent executable', () => {
		assert.strictEqual(which('definitely-not-a-real-shell-xyz'), undefined);
	});

	test('firstExisting returns the first path that exists as a file', () => {
		const tmpFile = path.join(os.tmpdir(), `oth-test-${Date.now()}.txt`);
		fs.writeFileSync(tmpFile, 'x');

		try {
			assert.strictEqual(firstExisting(['/no/such/path/abc', tmpFile]), tmpFile);
		} finally {
			fs.rmSync(tmpFile, { force: true });
		}
	});

	test('firstExisting returns undefined when no path exists', () => {
		assert.strictEqual(firstExisting(['/no/such/a', '/no/such/b']), undefined);
	});

	test('readEtcShells returns absolute paths (possibly an empty list)', () => {
		const shells = readEtcShells();

		assert.ok(Array.isArray(shells));
		for (const shell of shells) {
			assert.ok(path.isAbsolute(shell));
		}
	});

	test('detects at least one shell on the current platform', () => {
		const available = getAvailableShells();

		assert.ok(available.length > 0, 'Expected at least one available shell');
		for (const { def, shellPath } of available) {
			assert.ok(def.platforms.includes(process.platform));
			assert.ok(shellPath.length > 0);
		}
	});

	test('every shell definition has a unique command id and context key', () => {
		const commandIds = new Set(shellDefs.map((def) => def.commandId));
		const contextKeys = new Set(shellDefs.map((def) => def.contextKey));

		assert.strictEqual(commandIds.size, shellDefs.length);
		assert.strictEqual(contextKeys.size, shellDefs.length);
	});
});
