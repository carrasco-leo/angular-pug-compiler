#!/usr/bin/env node
//
// pug-compiler.mjs — @carrasco-leo/angular-pug-compiler
// ~/bin
//

import { runPugCompiler } from '../lib/esm/compiler.mjs';
import { helpText, parseArgs } from '../lib/esm/parse-args.mjs';

const options = parseArgs(process.argv.slice(2), {
	onHelp: () => console.log(helpText()),
});

runPugCompiler(options).catch((error) => {
	console.error('pug-compiler crashed:', error);
	process.exit(1);
});
