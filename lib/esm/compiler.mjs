//
// compiler.mjs — @carrasco-leo/angular-pug-compiler
// ~/lib/esm
//

import { existsSync, unlinkSync } from 'node:fs';
import { relative, join, isAbsolute } from 'node:path';

import { loadPlugins } from './load-plugins.mjs';

import controlFlowPlugins from './control-flow-plugins.mjs';

import { compileFile } from './compile-file.mjs';
import { prepareTree, resolveTree, resolvePath } from './tree-compilation.mjs';

function resolveFromCwd(p) {
	return isAbsolute(p) ? p : join(process.cwd(), p);
}

export async function runPugCompiler(options = {}) {
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

	function resolveAdd(absolutePath) {
		const path = relative(options.root, absolutePath);

		resolveTree(options, path);
		resolvePath(options, path);
	}

	function resolveChange(absolutePath) {
		const path = relative(options.root, absolutePath);

		resolveTree(options, path);
		resolvePath(options, path);
	}

	function resolveUnlink(absolutePath) {
		const path = relative(options.root, absolutePath);
		const htmlPath = absolutePath.replace(/\.pug$/, '.html');

		if (existsSync(htmlPath)) {
			unlinkSync(htmlPath);
			console.log(`🗑  Deleted ${relative(options.root, htmlPath)} (source .pug deleted)`);
		}

		for (const dependentPath of options.tree[path] || []) {
			options.links[dependentPath]?.delete(path);
			compileFile(dependentPath);
		}
	}
}
