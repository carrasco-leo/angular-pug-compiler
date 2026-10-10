//
// parse-args.ts — @carrasco-leo/angular-pug-compiler
// ~/src
//

export function helpText(): string {
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
  --control-flow-plugins   Add the default control flow plugin
`;
}

export interface ParseArgsOptions {
	onExit: (code?: number | string | null) => never;
	onHelp: () => void;
}

export interface ParseArgsValue {
	watch?: boolean;
	pattern?: string;
	root?: string;
	pluginsPath?: string;
	usePolling?: boolean;
	pollInterval?: number;
	controlFlowPlugins?: boolean;
}

export function parseArgs(
	argv: string[],
	options: ParseArgsOptions,
): ParseArgsValue {
	const value: ParseArgsValue = {
		watch: false,
		pattern: null,
		root: null,
		pluginsPath: null,
		usePolling:false,
		pollInterval: null,
		controlFlowPlugins: false,
	}
	options.onExit = options.onExit ?? process.exit;

	for (const arg of argv) {
		if (arg === '--watch' || arg === '-w') {
			value.watch = true;
		} else if (arg === '--use-polling') {
			value.usePolling = true;
		} else if (arg.startsWith('--pattern=')) {
			value.pattern = arg.slice('--pattern='.length);
		} else if (arg.startsWith('--root=')) {
			value.root = arg.slice('--root='.length);
		} else if (arg.startsWith('--plugins=')) {
			value.pluginsPath = arg.slice('--plugins='.length);
		} else if (arg.startsWith('--poll-interval=')) {
			value.pollInterval = Number(arg.slice('--poll-interval='.length));
		} else if (arg === '--help' || arg === '-h') {
			if (options.onHelp) {
				options.onHelp();
			}

			options.onExit(0);
			return value;
		} else {
			console.error(`Unknown argument: ${arg}`);
			if (options.onHelp) {
				options.onHelp();
			}

			options.onExit(1);
			return value;
		}
	}

	return value;
}
