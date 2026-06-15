import { describe, it, expect } from 'vitest';
import { expandRange } from '../cellRange';

describe('expandRange', () => {
  it('expands a single-column range', () => {
    expect(expandRange('A1', 'A5')).toEqual(['A1', 'A2', 'A3', 'A4', 'A5']);
  });

  it('expands a single-row range', () => {
    expect(expandRange('A1', 'C1')).toEqual(['A1', 'B1', 'C1']);
  });

  it('expands a 2D range column-first', () => {
    expect(expandRange('A1', 'B2')).toEqual(['A1', 'A2', 'B1', 'B2']);
  });

  it('handles reversed range endpoints', () => {
    expect(expandRange('A5', 'A1')).toEqual(['A1', 'A2', 'A3', 'A4', 'A5']);
  });

  it('returns empty array for invalid cell IDs', () => {
    expect(expandRange('A0', 'A5')).toEqual([]);
    expect(expandRange('A1', 'K1')).toEqual([]);
  });
});
