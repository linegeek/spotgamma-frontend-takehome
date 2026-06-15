import { expandRange } from './cellRange';
import { isValidCellId } from './cellId';
import type { CellId } from './types';

type TokenType =
  | 'NUMBER'
  | 'CELL_REF'
  | 'SUM'
  | 'PLUS'
  | 'MINUS'
  | 'STAR'
  | 'SLASH'
  | 'LPAREN'
  | 'RPAREN'
  | 'COLON';

interface Token {
  type: TokenType;
  value: string;
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (ch === ' ')  { i++; continue; }
    if (ch === '+')  { tokens.push({ type: 'PLUS',   value: '+' }); i++; continue; }
    if (ch === '-')  { tokens.push({ type: 'MINUS',  value: '-' }); i++; continue; }
    if (ch === '*')  { tokens.push({ type: 'STAR',   value: '*' }); i++; continue; }
    if (ch === '/')  { tokens.push({ type: 'SLASH',  value: '/' }); i++; continue; }
    if (ch === '(')  { tokens.push({ type: 'LPAREN', value: '(' }); i++; continue; }
    if (ch === ')')  { tokens.push({ type: 'RPAREN', value: ')' }); i++; continue; }
    if (ch === ':')  { tokens.push({ type: 'COLON',  value: ':' }); i++; continue; }

    if (/\d/.test(ch) || (ch === '.' && /\d/.test(input[i + 1] ?? ''))) {
      let num = '';
      while (i < input.length && /[\d.]/.test(input[i])) num += input[i++];
      tokens.push({ type: 'NUMBER', value: num });
      continue;
    }

    if (/[A-Za-z]/.test(ch)) {
      let word = '';
      while (i < input.length && /[A-Za-z0-9]/.test(input[i])) word += input[i++];
      const upper = word.toUpperCase();
      if (upper === 'SUM') {
        tokens.push({ type: 'SUM', value: 'SUM' });
      } else if (isValidCellId(upper)) {
        tokens.push({ type: 'CELL_REF', value: upper });
      } else {
        throw new Error('PARSE_ERROR');
      }
      continue;
    }

    throw new Error('PARSE_ERROR');
  }

  return tokens;
}
