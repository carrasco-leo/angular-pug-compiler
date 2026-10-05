//
// compile-file.mjs — @carrasco-leo/angular-pug-compiler
// ~/lib/esm
//

import { writeFileSync } from 'node:fs';
import { join, dirname, basename, relative } from 'node:path';
import { createRequire } from 'node:module';

import { compileFile as pugCompileFile } from 'pug';

/** @see https://nodejs.org/docs/latest/api/module.html#modulecreaterequirefilename */
const require = createRequire(import.meta.url);

export function compileFile(options, path) {
	const absolutePath = join(options.root, path);
	const dir = dirname(absolutePath);
	const fileName = dir + '/' + basename(path, '.pug') + '.html';

	try {
		const fn = pugCompileFile(absolutePath, {
			doctype: 'html',
			basedir: options.root,
			plugins: options.plugins,
		});

		const html = fn({
			require: (requirePath) => pugRequire(dir, requirePath),
		});

		writeFileSync(fileName, html, 'utf8');
		console.log(`✓ ${path} → ${relative(options.root, fileName)}`);
	} catch (error) {
		console.error(`✗ Failed to compile ${path} :`);
		console.error(`  ${error.message}\n`);

		if (!options.watch) {
			process.exitCode = 1;
		}
	}
}

function pugRequire(from, dest) {
	if (!dest.startsWith('./') && !dest.startsWith('../')) {
		return require(dest);
	}
	return require(join(from, dest));
}
