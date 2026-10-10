//
// compiler.ts — @carrasco-leo/angular-pug-compiler
// ~/src
//

import { existsSync, unlinkSync } from 'node:fs';
import { relative, join, isAbsolute } from 'node:path';

import { loadPlugins } from './load-plugins.js';
import { compileFile } from './compile-file.js';
import { prepareTree, resolveTree, resolvePath } from './tree-compilation.js';


import controlFlowPlugins from './control-flow-plugins.js';

import type { ParseArgsValue } from './parse-args.js';

export interface PugCompilerOptions extends ParseArgsValue {
	plugins?: any[];
	tree?: Record<string, Set<string>>;
	links?: Record<string, Set<string>>;
}

function resolveFromCwd(p: string): string {
	return isAbsolute(p) ? p : join(process.cwd(), p);
}

export async function runPugCompiler(
	options: PugCompilerOptions = {},
): Promise<void> {
	options.root = options.root ? resolveFromCwd(options.root) : process.cwd();
	options.pattern = options.pattern || 'projects/**/*.pug';
	options.watch = !!options.watch;
	options.usePolling = !!options.usePolling;
	options.pollInterval = options.pollInterval || 300;
	options.controlFlowPlugins = !!options.controlFlowPlugins;

	options.plugins = await loadPlugins(options.pluginsPath, options.root);
	if (options.controlFlowPlugins) {
		options.plugins.push(...controlFlowPlugins);
	}

	options.tree = {};
	options.links = {};

	await prepareTree(options);

	if (options.watch) {
		const chokidar = await import('chokidar');
		console.log(`\n👀 Watch mode enabled on ${options.pattern} (root: ${options.root}) — Ctrl+C to stop.\n`);

		chokidar
			.watch(join(options.root, options.pattern), {
				ignoreInitial: true,
				usePolling: options.usePolling,
				interval: options.pollInterval,
				awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
			})
			.on('add', resolveAdd)
			.on('change', resolveChange)
			.on('unlink', resolveUnlink)
			.on('error', (error) => console.error('Watcher error :', error));
	}

	function resolveAdd(absolutePath: string) {
		const path = relative(options.root, absolutePath);

		resolveTree(options, path);
		resolvePath(options, path);
	}

	function resolveChange(absolutePath: string) {
		const path = relative(options.root, absolutePath);

		resolveTree(options, path);
		resolvePath(options, path);
	}

	function resolveUnlink(absolutePath: string) {
		const path = relative(options.root, absolutePath);
		const htmlPath = absolutePath.replace(/\.pug$/, '.html');

		if (existsSync(htmlPath)) {
			unlinkSync(htmlPath);
			console.log(`🗑  Deleted ${relative(options.root, htmlPath)} (source .pug deleted)`);
		}

		for (const dependentPath of options.tree[path] || []) {
			options.links[dependentPath]?.delete(path);
			compileFile(options, dependentPath);
		}
	}
}
