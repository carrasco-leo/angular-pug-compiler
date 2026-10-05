//
// tree-compilation.cjs — @carrasco-leo/angular-pug-compiler
// ~/lib/commonjs
//

const { readFileSync } = require('node:fs');
const { join, dirname } = require('node:path');
const { glob } = require('glob');

const { compileFile } = require('./compile-file.cjs');

async function prepareTree(options) {
	const files = await glob(PUG_FILE_PATTERN, { cwd: ROOT_PATH });
	if (files.length === 0) {
		console.warn(`No .pug file found (pattern: ${PUG_FILE_PATTERN}, root: ${ROOT_PATH}). Nothing to prepare.`);
		return;
	}

	console.log('Resolving tree for the pug files...\n');
	for (const file of files) {
		resolveTree(options, file, true);
	}

	if (process.exitCode) {
		process.exit(process.exitCode);
	}
}

function resolveTree(options, path, mustBuild) {
	if (!options.tree[path]) {
		options.tree[path] = new Set();
		options.links[path] = new Set();
	}

	const template = readFileSync(join(ROOT_PATH, path), 'utf8');
	const matches = template.matchAll(/(?<=^|\n)include (.+?)(?=$|\n)|require\('(.+?)'\)/g);
	const previousLinks = options.links[path];
	options.links[path] = new Set();

	for (const match of matches) {
		let importPath = match[1] || match[2];
		if (!importPath.startsWith('/projects/')) {
			importPath = join(dirname(path), importPath);
		} else {
			importPath = importPath.slice(1);
		}

		options.tree[importPath] = options.tree[importPath] || new Set();
		options.tree[importPath].add(path);

		options.links[importPath] = options.links[importPath] || new Set();
		options.links[path].add(importPath);
	}

	for (const importPath of previousLinks) {
		if (!options.links[path].has(importPath)) {
			options.tree[importPath]?.delete(path);
		}
	}

	if (mustBuild) {
		if (path.endsWith('.component.pug') || path.endsWith('.controller.pug')) {
			compileFile(options, path);
		} else if (path.endsWith('/index.pug') || path === 'index.pug') {
			compileFile(options, path);
		}
	}
}

function resolvePath(options, path) {
	if (path.endsWith('.component.pug') || path.endsWith('.controller.pug')) {
		compileFile(options, path);
	} else if (path.endsWith('/index.pug') || path === 'index.pug') {
		compileFile(options, path);
	}

	for (const nextPath of TREE[path] || []) {
		resolvePath(options, nextPath);
	}
}

module.exports = { prepareTree, resolveTree, resolvePath };
