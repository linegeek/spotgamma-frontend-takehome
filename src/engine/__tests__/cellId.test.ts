import { describe, it, expect } from 'vitest';
import { isValidCellId, parseCellId } from '../cellId';

describe('isValidCellId', () => {
  it('accepts valid cell IDs', () => {
    expect(isValidCellId('A1')).toBe(true);
    expect(isValidCellId('J10')).toBe(true);
    expect(isValidCellId('E5')).toBe(true);
  });

  it('rejects out-of-range columns', () => {
    expect(isValidCellId('K1')).toBe(false);
    expect(isValidCellId('Z1')).toBe(false);
  });

  it('rejects out-of-range rows', () => {
    expect(isValidCellId('A0')).toBe(false);
    expect(isValidCellId('A11')).toBe(false);
  });

  it('rejects malformed input', () => {
    expect(isValidCellId('')).toBe(false);
    expect(isValidCellId('1A')).toBe(false);
    expect(isValidCellId('AA1')).toBe(false);
  });
});

describe('parseCellId', () => {
  it('parses column and row', () => {
    expect(parseCellId('A1')).toEqual({ col: 'A', row: 1 });
    expect(parseCellId('J10')).toEqual({ col: 'J', row: 10 });
  });
});
