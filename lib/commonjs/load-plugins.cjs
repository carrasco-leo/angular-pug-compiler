//
// load-plugins.cjs — @carrasco-leo/angular-pug-compiler
// ~/lib/commonjs
//

const { existsSync } = require('node:fs');
const { isAbsolute, join, relative } = require('node:path');

function loadPlugins(pluginsPath, root) {
	if (!pluginsPath) {
		return [];
	}

	const resolvedPath = isAbsolute(pluginsPath) ? pluginsPath : join(root, pluginsPath);

	if (!existsSync(resolvedPath)) {
		console.warn(`⚠ Plugins file not found: ${resolvedPath}. Continuing without plugins.`);
		return [];
	}

	const loaded = require(resolvedPath);
	if (!Array.isArray(loaded.plugins)) {
		console.warn(`⚠ ${resolvedPath} does not export a "plugins" array. Continuing without plugins.`);
		return [];
	}

	console.log(`🔌 ${loaded.plugins.length} Pug plugin(s) loaded from ${relative(root, resolvedPath)}\n`);
	return loaded.plugins;
}

module.exports = { loadPlugins };
