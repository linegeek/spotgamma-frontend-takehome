import { describe, it, expect } from 'vitest';
import { extractDeps, parseFormula } from '../formulaParser';

const cells = { A1: 10, B1: 5, C1: 2 };

describe('extractDeps', () => {
  it('extracts cell references', () => {
    expect(extractDeps('A1 + B1')).toEqual(['A1', 'B1']);
  });

  it('extracts range references from SUM', () => {
    expect(extractDeps('SUM(A1:A3)')).toEqual(['A1', 'A2', 'A3']);
  });

  it('deduplicates repeated refs', () => {
    expect(extractDeps('A1 + A1')).toEqual(['A1']);
  });

  it('returns empty for plain number', () => {
    expect(extractDeps('42')).toEqual([]);
  });
});

describe('parseFormula', () => {
  it('evaluates addition', () => {
    expect(parseFormula('A1 + B1')(cells)).toBe(15);
  });

  it('evaluates subtraction', () => {
    expect(parseFormula('A1 - B1')(cells)).toBe(5);
  });

  it('evaluates multiplication', () => {
    expect(parseFormula('A1 * C1')(cells)).toBe(20);
  });

  it('evaluates division', () => {
    expect(parseFormula('A1 / C1')(cells)).toBe(5);
  });

  it('respects operator precedence', () => {
    expect(parseFormula('A1 + B1 * C1')(cells)).toBe(20);
  });

  it('handles parentheses', () => {
    expect(parseFormula('(A1 + B1) * C1')(cells)).toBe(30);
  });

  it('evaluates SUM range', () => {
    const c = { A1: 1, A2: 2, A3: 3 };
    expect(parseFormula('SUM(A1:A3)')(c)).toBe(6);
  });

  it('throws on division by zero', () => {
    expect(() => parseFormula('A1 / C1')({ A1: 10, C1: 0 })).toThrow('DIV_ZERO');
  });

  it('throws on invalid syntax', () => {
    expect(() => parseFormula('A1 +')).toThrow();
  });
});
