//
// tree-compilation.ts — @carrasco-leo/angular-pug-compiler
// ~/src
//

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

import { glob } from 'glob';

import { compileFile } from './compile-file.js';

import type { PugCompilerOptions } from './compiler.js';

export async function prepareTree(options: PugCompilerOptions): Promise<void> {
	const files = await glob(options.pattern, { cwd: options.root });
	if (files.length === 0) {
		console.warn(`No .pug file found (pattern: ${options.pattern}, root: ${options.root}). Nothing to prepare.`);
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

export function resolveTree(
	options: PugCompilerOptions,
	path: string,
	mustBuild: boolean = false,
): void {
	if (!options.tree[path]) {
		options.tree[path] = new Set();
		options.links[path] = new Set();
	}

	const template = readFileSync(join(options.root, path), 'utf8');
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

export function resolvePath(options: PugCompilerOptions, path: string): void {
	if (path.endsWith('.component.pug') || path.endsWith('.controller.pug')) {
		compileFile(options, path);
	} else if (path.endsWith('/index.pug') || path === 'index.pug') {
		compileFile(options, path);
	}

	for (const nextPath of options.tree[path] || []) {
		resolvePath(options, nextPath);
	}
}
