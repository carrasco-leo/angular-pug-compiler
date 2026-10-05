//
// compile-file.cjs — @carrasco-leo/angular-pug-compiler
// ~/lib/commonjs
//

const { writeFileSync } = require('node:fs');
const { join, dirname, basename, relative } = require('node:path');
const { compileFile: pugCompileFile } = require('pug');

function compileFile(options, path) {
	const absolutePath = join(options.root, path);
	const dir = dirname(absolutePath);
	const fileName = dir + '/' + basename(path, '.pug') + '.html';

	try {
		const fn = pugCompileFile(absolutePath, {
			doctype: 'html',
			basedir: options.root,
			plugins,
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

module.exports = { compileFile };
