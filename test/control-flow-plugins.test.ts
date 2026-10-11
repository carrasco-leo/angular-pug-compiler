//
// control-flow-plugins.test.ts — @carrasco-leo/angular-pug-compiler
// ~/test
//

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import pug from 'pug';

import controlFlowPlugins from '../src/control-flow-plugins.js';

const filename = '/tmp/control-flow.test.pug';

function compileTemplate(source: string, plugins = controlFlowPlugins): string {
	return pug.compile(source, {
		filename,
		doctype: 'html',
		plugins,
	})();
}

describe('Control Flow plugin', () => {
	describe('@if', () => {
		it('should compile a basic @if block', () => {
			const html = compileTemplate(`
div
	@if (isVisible) {
		p Visible content
	}
`);

			assert.match(html, /@if\s*\(isVisible\)\s*\{/);
			assert.match(html, /<p>Visible content<\/p>/);
			assert.match(html, /\}/);
		});

		it('should compile an @if/@else block', () => {
			const html = compileTemplate(`
div
	@if (isVisible) {
		p Visible content
	} @else {
		p Hidden content
	}
`);

			assert.match(html, /@if\s*\(isVisible\)\s*\{/);
			assert.match(html, /}\s*@else\s*\{/);
			assert.match(html, /<p>Visible content<\/p>/);
			assert.match(html, /<p>Hidden content<\/p>/);
		});

		it('should preserve an @else if branch', () => {
			const html = compileTemplate(`
div
	@if (firstCondition) {
		p First branch
	} @else if (secondCondition) {
		p Second branch
	} @else {
		p Default branch
	}
`);

			assert.match(html, /@if\s*\(firstCondition\)\s*\{/);
			assert.match(html, /@else if\s*\(secondCondition\)\s*\{/);
			assert.match(html, /@else\s*\{/);
			assert.match(html, /<p>First branch<\/p>/);
			assert.match(html, /<p>Second branch<\/p>/);
			assert.match(html, /<p>Default branch<\/p>/);
		});
	});

	describe('@for', () => {
		it('should compile a basic @for block', () => {
			const html = compileTemplate(`
ul
	@for (item of items; track item.id) {
		li {{ item.name }}
	}
`);

			assert.match(html, /@for\s*\(item of items; track item\.id\)\s*\{/);
			assert.match(html, /<li>/);
			assert.match(html, /\{\{\s*item\.name\s*\}\}/);
		});

		it('should preserve an @empty block', () => {
			const html = compileTemplate(`
ul
	@for (item of items; track item) {
		li {{ item }}
	} @empty {
		li No items
	}
`);

			assert.match(html, /@for\s*\(item of items; track item\)\s*\{/);
			assert.match(html, /}\s*@empty\s*\{/);
			assert.match(html, /<li>No items<\/li>/);
		});
	});

	describe('@switch', () => {
		it('should compile @switch, @case, and @default blocks', () => {
			const html = compileTemplate(`
div
	@switch (status) {
		@case ('active') {
			p Active
		}
		@case ('pending') {
			p Pending
		}
		@default {
			p Unknown
		}
	}
`);

			assert.match(html, /@switch\s*\(status\)\s*\{/);
			assert.match(html, /@case\s*\('active'\)\s*\{/);
			assert.match(html, /@case\s*\('pending'\)\s*\{/);
			assert.match(html, /@default\s*\{/);
			assert.match(html, /<p>Active<\/p>/);
			assert.match(html, /<p>Pending<\/p>/);
			assert.match(html, /<p>Unknown<\/p>/);
		});
	});

	describe('Nested blocks', () => {
		it('should compile nested control-flow blocks', () => {
			const html = compileTemplate(`
div
	@if (isVisible) {
		section
			@for (item of items; track item.id) {
				p {{ item.name }}
			}
	}
`);

			assert.match(html, /@if\s*\(isVisible\)\s*\{/);
			assert.match(html, /@for\s*\(item of items; track item\.id\)\s*\{/);
			assert.match(html, /<section>/);
			assert.match(html, /<p>/);
			assert.match(html, /\{\{\s*item\.name\s*\}\}/);
		});
	});

	describe('Standard Pug compatibility', () => {
		it('should compile standard Pug without requiring control-flow syntax', () => {
			const html = compileTemplate(`
main
	h1 Hello
	p Standard Pug content
`);

			assert.match(html, /<main>/);
			assert.match(html, /<h1>Hello<\/h1>/);
			assert.match(html, /<p>Standard Pug content<\/p>/);
		});

		it('should preserve Angular interpolation inside standard Pug elements', () => {
			const html = compileTemplate(`
p Hello, {{ user.name }}!
`);

			assert.match(html, /Hello, \{\{\s*user\.name\s*\}\}!/);
		});
	});

	describe('Syntax errors', () => {
		it('should throw when a control-flow expression is missing its opening brace', () => {
			assert.throws(() => {
				compileTemplate(`
div
	@if (isVisible)
		p Visible content
`);
			});
		});
	});
});
