//
// parse-args.test.ts — @carrasco-leo/angular-pug-compiler
// ~/test
//

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { parseArgs } from '../src/parse-args.js';

class ExitSignal extends Error {
  constructor(public readonly exitCode: number | string | null | undefined) {
    super(`Process exit requested with code: ${exitCode}`);
    this.name = 'ExitSignal';
  }
}

function runParseArgs(argv: string[]) {
  const state = { helpCalled: false };

  const result = () =>
    parseArgs(argv, {
      onExit: (code?: number | string | null): never => {
        throw new ExitSignal(code);
      },
      onHelp: () => {
        state.helpCalled = true;
      },
    });

  return { result, state };
}

describe('parseArgs()', () => {
  it('should return default values when no arguments are provided', () => {
    const { result } = runParseArgs([]);

    assert.deepEqual(result(), {
      watch: false,
      pattern: null,
      root: null,
      pluginsPath: null,
      usePolling: false,
      pollInterval: null,
      controlFlowPlugins: false,
    });
  });

  it('should enable watch mode with --watch', () => {
    const { result } = runParseArgs(['--watch']);

    assert.equal(result().watch, true);
  });

  it('should enable watch mode with -w', () => {
    const { result } = runParseArgs(['-w']);

    assert.equal(result().watch, true);
  });

  it('should enable polling with --use-polling', () => {
    const { result } = runParseArgs(['--use-polling']);

    assert.equal(result().usePolling, true);
  });

  it('should parse the pattern option', () => {
    const { result } = runParseArgs(['--pattern=src/**/*.pug']);

    assert.equal(result().pattern, 'src/**/*.pug');
  });

  it('should parse the root option', () => {
    const { result } = runParseArgs(['--root=src']);

    assert.equal(result().root, 'src');
  });

  it('should parse the plugins path option', () => {
    const { result } = runParseArgs(['--plugins=./plugins']);

    assert.equal(result().pluginsPath, './plugins');
  });

  it('should parse the polling interval as a number', () => {
    const { result } = runParseArgs(['--poll-interval=500']);

    assert.equal(result().pollInterval, 500);
  });

  it('should parse multiple options together', () => {
    const { result } = runParseArgs([
      '--watch',
      '--use-polling',
      '--poll-interval=250',
      '--pattern=src/**/*.pug',
      '--root=src',
      '--plugins=./plugins',
    ]);

    assert.deepEqual(result(), {
      watch: true,
      pattern: 'src/**/*.pug',
      root: 'src',
      pluginsPath: './plugins',
      usePolling: true,
      pollInterval: 250,
      controlFlowPlugins: false,
    });
  });

  it('should display help and exit with code 0 when --help is provided', () => {
    const { result, state } = runParseArgs(['--help']);

    assert.throws(result, (error: unknown) => {
      assert.ok(error instanceof ExitSignal);
      assert.equal(error.exitCode, 0);
      return true;
    });

    assert.equal(state.helpCalled, true);
  });

  it('should display help and exit with code 0 when -h is provided', () => {
    const { result, state } = runParseArgs(['-h']);

    assert.throws(result, (error: unknown) => {
      assert.ok(error instanceof ExitSignal);
      assert.equal(error.exitCode, 0);
      return true;
    });

    assert.equal(state.helpCalled, true);
  });

  it('should exit with code 1 when an unknown argument is provided', () => {
    const { result, state } = runParseArgs(['--unknown']);

    const originalError = console.error;
    console.error = () => {};

    try {
      assert.throws(result, (error: unknown) => {
        assert.ok(error instanceof ExitSignal);
        assert.equal(error.exitCode, 1);
        return true;
      });
    } finally {
      console.error = originalError;
    }

    assert.equal(state.helpCalled, true);
  });

  it('should reject arguments that do not match a supported option format', () => {
    const { result } = runParseArgs(['--pattern']);

    const originalError = console.error;
    console.error = () => {};

    try {
      assert.throws(result, (error: unknown) => {
        assert.ok(error instanceof ExitSignal);
        assert.equal(error.exitCode, 1);
        return true;
      });
    } finally {
      console.error = originalError;
    }
  });
});
