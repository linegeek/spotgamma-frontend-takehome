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

class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(type?: TokenType): Token {
    const t = this.tokens[this.pos++];
    if (!t) throw new Error('PARSE_ERROR');
    if (type && t.type !== type) throw new Error('PARSE_ERROR');
    return t;
  }

  parseExpr(): (cells: Record<CellId, number>) => number {
    let left = this.parseTerm();
    while (this.peek()?.type === 'PLUS' || this.peek()?.type === 'MINUS') {
      const op = this.consume().type;
      const right = this.parseTerm();
      const prev = left;
      left = op === 'PLUS'
        ? (c) => prev(c) + right(c)
        : (c) => prev(c) - right(c);
    }
    return left;
  }

  private parseTerm(): (cells: Record<CellId, number>) => number {
    let left = this.parseFactor();
    while (this.peek()?.type === 'STAR' || this.peek()?.type === 'SLASH') {
      const op = this.consume().type;
      const right = this.parseFactor();
      const prev = left;
      left = op === 'STAR'
        ? (c) => prev(c) * right(c)
        : (c) => {
            const d = right(c);
            if (d === 0) throw new Error('DIV_ZERO');
            return prev(c) / d;
          };
    }
    return left;
  }

  private parseFactor(): (cells: Record<CellId, number>) => number {
    const t = this.peek();
    if (!t) throw new Error('PARSE_ERROR');

    if (t.type === 'NUMBER') {
      this.consume();
      const val = parseFloat(t.value);
      return () => val;
    }

    if (t.type === 'CELL_REF') {
      this.consume();
      const id = t.value as CellId;
      return (cells) => {
        if (!(id in cells)) throw new Error('REF_ERROR');
        return cells[id];
      };
    }

    if (t.type === 'SUM') {
      this.consume();
      this.consume('LPAREN');
      const start = this.consume('CELL_REF').value as CellId;
      this.consume('COLON');
      const end = this.consume('CELL_REF').value as CellId;
      this.consume('RPAREN');
      const ids = expandRange(start, end);
      return (cells) =>
        ids.reduce((acc, id) => {
          if (!(id in cells)) throw new Error('REF_ERROR');
          return acc + cells[id];
        }, 0);
    }

    if (t.type === 'LPAREN') {
      this.consume();
      const inner = this.parseExpr();
      this.consume('RPAREN');
      return inner;
    }

    throw new Error('PARSE_ERROR');
  }

  get currentPos(): number {
    return this.pos;
  }

  get totalTokens(): number {
    return this.tokens.length;
  }
}
