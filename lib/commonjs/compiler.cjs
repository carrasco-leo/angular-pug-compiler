//
// compiler.cjs — @carrasco-leo/angular-pug-compiler
// ~/lib/commonjs
//

const { existsSync, unlinkSync } = require('node:fs');
const { isAbsolute, join, relative } = require('node:path');

const { loadPlugins } = require('./load-plugins.cjs');
const controlFlowPlugins = require('./control-flow-plugins.cjs');
const { compileFile } = require('./compile-file.cjs');
const { prepareTree, resolveTree, resolvePath } = require('./tree-compilation.cjs');

function resolveFromCwd(p) {
	return isAbsolute(p) ? p : join(process.cwd(), p);
}

async function runPugCompiler(options = {}) {
	options.root = options.root ? resolveFromCwd(options.root) : process.cwd();
	options.pattern = options.pattern || 'projects/**/*.pug';
	options.watch = !!options.watch;
	options.usePolling = !!options.usePolling;
	options.pollInterval = options.pollInterval || 300;
	options.controlFlowPlugins = !!options.controlFlowPlugins;

	const plugins = loadPlugins(options.pluginsPath, options.root);
	if (options.controlFlowPlugins) {
		plugins.push(...controlFlowPlugins);
	}

	options.tree = {};
	options.links = {};

	await prepareTree(options);

	if (options.watch) {
		const chokidar = require('chokidar');
		console.log(`\n👀 Watch mode enabled on ${PUG_FILE_PATTERN} (root: ${ROOT_PATH}) — Ctrl+C to stop.\n`);

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
		const path = relative(ROOT_PATH, absolutePath);
		const htmlPath = absolutePath.replace(/\.pug$/, '.html');

		if (existsSync(htmlPath)) {
			unlinkSync(htmlPath);
			console.log(`🗑  Deleted ${relative(ROOT_PATH, htmlPath)} (source .pug deleted)`);
		}

		for (const dependentPath of TREE[path] || []) {
			options.links[dependentPath]?.delete(path);
			compileFile(dependentPath);
		}
	}
}

module.exports = { runPugCompiler };
