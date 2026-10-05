//
// control-flow-plugins.mjs — @carrasco-leo/angular-pug-compiler
// ~/lib/esm
//

/**
 * Plugin that allow you to write angular control flow directly in Pug instead
 * of writing them as text output.
 *
 * Without:
 * ```pug
 * 	| @if (expression) {
 * 	p Hello World!
 *  | }
 * ```
 *
 * You can do like this:
 * ```pug
 * 	@if (expression) {
 * 		p Hello World!
 * 	}
 * ```
 */
export default [
	{ lex: {
		eos: (lexer) => {
			if (lexer.input.length) return;

			for (let i = 0; i < lexer.tokens.length; i++) {
				const tok = lexer.tokens[i];
				if (tok.type === 'ng-cf-end') {
					if (lexer.tokens[i + 1]?.type === 'ng-cf') {
						lexer.tokens[i + 1].val = '} ' + lexer.tokens[i + 1].val;
						lexer.tokens.splice(i, 1);
						i--;
					} else {
						tok.type = 'text';
					}
				} else if (tok.type === 'ng-cf') {
					tok.type = 'text';

					if (lexer.tokens[i + 1]?.type === 'indent') {
						lexer.tokens[i + 1].type = 'newline';
					}
				}
			}
		},
		text: (lexer) => {
			let match = lexer.input.match(/^ *@(\w+(?: +\w+)*) *(?=\()/);
			if (match) {
				const cfType = match[1];
				lexer.incrementColumn(match[0].length);

				match = lexer.bracketExpression(match[0].length);
				lexer.consume(match.end + 1);

				const opTok = lexer.scan(/^( *\{)/);
				if (!opTok) {
					lexer.error('NO_BEGIN_BRACKET', 'Missing { after control flow expression.');
				}

				const tok = lexer.tok('ng-cf', `@${cfType} (${match.src}) {`);
				lexer.tokens.push(tok);

				const splitted = match.src.split('\n');
				const lines = splitted.length - 1;

				lexer.incrementLine(lines);
				lexer.incrementColumn(splitted[lines].length + opTok.val.length);
				lexer.tokEnd(tok);

				return true;
			}

			const tok = lexer.scan(/^ *@(\w+(?: +\w+)*) *\{/, 'ng-cf');
			if (tok) {
				lexer.incrementColumn(tok.val.length);
				tok.val = `@${tok.val} {`;

				lexer.tokens.push(tok);
				lexer.tokEnd(tok);
				return true;
			}

			const tokEnd = lexer.scan(/^(\})/, 'ng-cf-end');
			if (tokEnd) {
				if (lexer.tokens[lexer.tokens.length - 1].type === 'outdent') {
					lexer.tokens[lexer.tokens.length - 1].type = 'newline';
				}

				lexer.tokens.push(tokEnd);
				lexer.incrementColumn(tokEnd.val.length);
				lexer.tokEnd(tokEnd);
				return true;
			}
		},
	} },
];

