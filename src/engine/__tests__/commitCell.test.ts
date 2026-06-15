import { describe, it, expect } from 'vitest';
import { createInitialState } from '../createInitialState';
import { commitCell } from '../commitCell';

describe('commitCell', () => {
  it('commits a plain number', () => {
    const s0 = createInitialState();
    const s1 = commitCell(s0, 'A1', '42');
    expect(s1.cells['A1'].computed).toBe(42);
    expect(s1.cells['A1'].error).toBeNull();
  });

  it('commits a plain string', () => {
    const s0 = createInitialState();
    const s1 = commitCell(s0, 'A1', 'hello');
    expect(s1.cells['A1'].computed).toBe('hello');
  });

  it('evaluates a formula', () => {
    let s = createInitialState();
    s = commitCell(s, 'A1', '10');
    s = commitCell(s, 'B1', '=A1*2');
    expect(s.cells['B1'].computed).toBe(20);
  });

  it('propagates changes to dependent cells', () => {
    let s = createInitialState();
    s = commitCell(s, 'A1', '5');
    s = commitCell(s, 'B1', '=A1*2');
    s = commitCell(s, 'C1', '=B1+1');
    s = commitCell(s, 'A1', '10');
    expect(s.cells['B1'].computed).toBe(20);
    expect(s.cells['C1'].computed).toBe(21);
  });

  it('rejects a direct circular reference', () => {
    let s = createInitialState();
    s = commitCell(s, 'A1', '=B1');
    s = commitCell(s, 'B1', '=A1');
    expect(s.cells['B1'].error).toBe('CIRCULAR_REF');
  });

  it('rejects an indirect circular reference', () => {
    let s = createInitialState();
    s = commitCell(s, 'A1', '=B1');
    s = commitCell(s, 'B1', '=C1');
    s = commitCell(s, 'C1', '=A1');
    expect(s.cells['C1'].error).toBe('CIRCULAR_REF');
  });

  it('preserves old raw on cycle rejection', () => {
    let s = createInitialState();
    s = commitCell(s, 'A1', '99');
    s = commitCell(s, 'B1', '=A1');
    s = commitCell(s, 'A1', '=B1'); // cycle
    expect(s.cells['A1'].raw).toBe('99');
  });
});
