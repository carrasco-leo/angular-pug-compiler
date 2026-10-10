# @carrasco-leo/angular-pug-compiler

[![npm version](https://img.shields.io/npm/v/@carrasco-leo/angular-pug-compiler.svg)](https://www.npmjs.com/package/@carrasco-leo/angular-pug-compiler)
[![npm downloads](https://img.shields.io/npm/dm/@carrasco-leo/angular-pug-compiler.svg)](https://www.npmjs.com/package/@carrasco-leo/angular-pug-compiler)
[![License](https://img.shields.io/npm/l/@carrasco-leo/angular-pug-compiler.svg)](https://github.com/carrasco-leo/angular-pug-compiler/blob/main/LICENSE)

Compile Pug templates into HTML that can be used normally through `templateUrl`
in Angular components.

The compiler tracks `include`/`require` dependencies between templates and
supports cascading recompilation and watch mode.

## Features

* Compile Pug templates to HTML for use with Angular `templateUrl`.
* Track dependencies between Pug templates.
* Automatically recompile dependent templates when an included template changes.
* Watch templates and recompile them automatically.
* Support glob patterns for flexible project structures.
* Support Angular workspaces with multiple projects.
* Use a custom project root.
* Load custom Pug plugins.
* Use `--control-flow-plugins` to write Angular control-flow blocks directly in
  Pug's indentation-based structure.
* Support polling mode for environments where native filesystem events are
  unreliable.

## Installation

Install the package as a development dependency:

```bash
npm install -D @carrasco-leo/angular-pug-compiler
```

## Usage

### Command line

Compile all matching Pug templates once:

```bash
npx pug-compiler --pattern="src/**/*.pug"
```

Run the compiler in watch mode:

```bash
npx pug-compiler --watch
```

For a simple project structure:

```bash
npx pug-compiler --pattern="src/**/*.pug"
```

For an Angular workspace containing multiple projects:

```bash
npx pug-compiler --pattern="projects/*/src/**/*.pug"
```

Use a different project root:

```bash
npx pug-compiler --root=/absolute/path
```

Load custom Pug plugins:

```bash
npx pug-compiler --plugins=./pug-plugins.js
```

#### Angular control-flow syntax

Enable `--control-flow-plugins` to use Angular control-flow blocks as part of
Pug's indentation-based template structure. This avoids writing the control-flow
statements as Pug text nodes prefixed with `|`.

For example, instead of writing:

```pug
div
  | @if (condition) {
  p Condition is true!
  | } @else {
  p Condition is false!
  | }
```

You can write:

```pug
div
  @if (condition) {
    p Condition is true!
  } @else {
    p Condition is false!
  }
```

Enable the plugin when compiling your templates:

```bash
npx pug-compiler --control-flow-plugins --pattern="src/**/*.pug"
```

It can also be combined with watch mode:

```bash
npx pug-compiler --control-flow-plugins --watch --pattern="src/**/*.pug"
```

Use polling when native filesystem events are unreliable:

```bash
npx pug-compiler --watch --use-polling
```

You can also configure the polling interval:

```bash
npx pug-compiler --watch --use-polling --poll-interval=500
```

### `package.json`

A typical Angular workspace configuration could look like this:

```json
{
  "scripts": {
    "pug:build": "pug-compiler --control-flow-plugins --pattern=\"projects/*/src/**/*.pug\"",
    "pug:watch": "pug-compiler --control-flow-plugins --watch --use-polling --pattern=\"projects/*/src/**/*.pug\"",
    "prebuild": "npm run pug:build",
    "prestart": "npm run pug:build",
    "start": "concurrently -n pug,ng -c yellow,blue \"npm run pug:watch\" \"ng serve\""
  }
}
```

This allows the Pug compiler to run automatically before the Angular build and
development server.

## Programmatic usage

The compiler can also be used as a Node.js module:

```js
import { runPugCompiler } from '@carrasco-leo/angular-pug-compiler';

runPugCompiler({
  root: process.cwd(),
  pattern: 'projects/*/src/**/*.pug',
  watch: true,
  usePolling: true,
  pluginsPath: './pug-plugins.js',
});
```

## Pug plugins

Custom Pug plugins can be loaded with the `--plugins` command-line option or
the `pluginsPath` programmatic option.

The specified file must export a `plugins` array following the
[Pug plugin API](https://pugjs.org/api/plugins.html):

```js
// pug-plugins.js, at the root of the consuming project
export const plugins = [
  {
    // IMPORTANT: preLex receives (source, options) — not a single object —
    // and the returned value REPLACES the source code before lexing.
    // Forgetting to return `source` breaks compilation because the template
    // becomes `undefined`.
    preLex: (source, options) => {
      console.log(`→ lex: ${options.filename}`);
      return source;
    },
  },
];
```

## How dependency tracking works

The compiler distinguishes between entry-point templates and partial templates.

The following files are compiled directly:

* `.component.pug`
* `.controller.pug`
* `index.pug`

Other `.pug` files are treated as partials and are expected to be included
through Pug's `include` mechanism.

When a partial changes, the compiler can use the dependency tree to determine
which templates depend on it and recompile the affected templates.

This allows changes to shared Pug templates to propagate automatically without
requiring every template to be compiled independently.

If your project uses a different naming convention, the dependency resolution
logic can be adapted through `resolveTree`/`resolvePath` in
`lib/compiler.js`.

## Watch mode

Watch mode continuously monitors the relevant Pug files and recompiles affected
templates when changes are detected:

```bash
npx pug-compiler --watch
```

### Polling mode

Polling can be enabled when filesystem events are not reliably propagated:

```bash
npx pug-compiler --watch --use-polling
```

The polling interval can be configured with `--poll-interval`:

```bash
npx pug-compiler --watch --use-polling --poll-interval=500
```

Polling is particularly useful under WSL2 when files are edited through a path
such as:

```text
\\wsl.localhost\...
```

In this situation, filesystem access goes through the 9P network layer and
native `inotify` events may not be reliably propagated.

## Compatibility notes

### chokidar

`chokidar` is intentionally pinned to the v3.x release line.

Version 4 removed support for glob patterns in `.watch()`, which would break
the glob-based change detection used by this project.

## Contributing

Contributions, bug reports, and suggestions are welcome.

If you find a bug or have an idea for an improvement, please open an issue:

https://github.com/carrasco-leo/angular-pug-compiler/issues

When submitting a pull request, please provide a clear description of the
problem or feature being addressed and include appropriate tests when
applicable.

## Development

Clone the repository:

```bash
git clone https://github.com/carrasco-leo/angular-pug-compiler.git
cd angular-pug-compiler
```

Install the dependencies:

```bash
npm install
```

Run the project tests:

```bash
npm test
```

Additional development commands may be added as the project evolves.

## License

Copyright © Léo CARRASCO

This project is licensed under the [MIT License](LICENSE).
