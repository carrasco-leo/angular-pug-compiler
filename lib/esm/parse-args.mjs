//
// parse-args.mjs — @carrasco-leo/angular-pug-compiler
// ~/esm
//

export function helpText() {
	return `
pug-compiler — compile Pug templates to HTML for Angular templateUrl

Usage:
  pug-compiler [options]

Options:
  --watch, -w              Watch mode: recompile on change
  --pattern=<glob>         Glob pattern, relative to root (default: "projects/**/*.pug")
  --root=<path>            Root directory to resolve pattern from (default: cwd)
  --plugins=<path>         Path to a module exporting { plugins } for Pug
  --use-polling            Force chokidar polling (needed on WSL2 / network filesystems)
  --poll-interval=<ms>     Polling interval in ms (default: 300)
  --help, -h                Show this help
`;
}

export function parseArgs(argv, { onExit = process.exit, onHelp } = {}) {
	const options = { watch: false, usePolling: false };

	for (const arg of argv) {
		if (arg === '--watch' || arg === '-w') {
			options.watch = true;
		} else if (arg === '--use-polling') {
			options.usePolling = true;
		} else if (arg.startsWith('--pattern=')) {
			options.pattern = arg.slice('--pattern='.length);
		} else if (arg.startsWith('--root=')) {
			options.root = arg.slice('--root='.length);
		} else if (arg.startsWith('--plugins=')) {
			options.pluginsPath = arg.slice('--plugins='.length);
		} else if (arg.startsWith('--poll-interval=')) {
			options.pollInterval = Number(arg.slice('--poll-interval='.length));
		} else if (arg === '--help' || arg === '-h') {
			if (onHelp) onHelp();
			onExit(0);
			return options;
		} else {
			console.error(`Unknown argument: ${arg}`);
			if (onHelp) onHelp();
			onExit(1);
			return options;
		}
	}

	return options;
}

