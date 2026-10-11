//
// compiler.test.ts — @carrasco-leo/angular-pug-compiler
// ~/test
//

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	mkdtemp,
	mkdir,
	readFile,
	rm,
	writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// À adapter au chemin réel de ton module source.
import { runPugCompiler } from '../src/compiler.js';

test('compiles index.pug into HTML', async (t) => {
	const root = await mkdtemp(
		join(tmpdir(), 'angular-pug-compiler-'),
	);

	t.after(async () => {
		await rm(root, { recursive: true, force: true });
	});

	const sourceDirectory = join(root, 'src');
	await mkdir(sourceDirectory, { recursive: true });

	await writeFile(
		join(sourceDirectory, 'index.pug'),
		'p Hello world!\n',
		'utf8',
	);

	await runPugCompiler({
		root,
		pattern: 'src/**/*.pug',
	});

	const html = await readFile(
		join(sourceDirectory, 'index.html'),
		'utf8',
	);

	assert.match(html, /<p>Hello world!<\/p>/);
});
