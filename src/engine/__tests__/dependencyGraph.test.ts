import { describe, it, expect } from 'vitest';
import { createEmptyGraph, updateEdges, wouldCreateCycle, topoOrder } from '../dependencyGraph';

describe('wouldCreateCycle', () => {
  it('detects a direct cycle', () => {
    let g = createEmptyGraph();
    g = updateEdges(g, 'A1', new Set(['B1'])); // A1 depends on B1
    // now trying B1 depends on A1 — should detect cycle
    expect(wouldCreateCycle(g, 'B1', new Set(['A1']))).toBe(true);
  });

  it('detects an indirect cycle', () => {
    let g = createEmptyGraph();
    g = updateEdges(g, 'A1', new Set(['B1']));
    g = updateEdges(g, 'B1', new Set(['C1']));
    // C1 depends on A1 would create A1→B1→C1→A1
    expect(wouldCreateCycle(g, 'C1', new Set(['A1']))).toBe(true);
  });

  it('does not flag a valid dependency', () => {
    let g = createEmptyGraph();
    g = updateEdges(g, 'B1', new Set(['A1']));
    expect(wouldCreateCycle(g, 'C1', new Set(['B1']))).toBe(false);
  });
});

describe('topoOrder', () => {
  it('orders deps before dependents', () => {
    let g = createEmptyGraph();
    g = updateEdges(g, 'B1', new Set(['A1']));
    g = updateEdges(g, 'C1', new Set(['B1']));
    const order = topoOrder(g, 'A1');
    expect(order.indexOf('A1')).toBeLessThan(order.indexOf('B1'));
    expect(order.indexOf('B1')).toBeLessThan(order.indexOf('C1'));
  });

  it('includes only the changed cell when it has no dependents', () => {
    const g = createEmptyGraph();
    expect(topoOrder(g, 'A1')).toEqual(['A1']);
  });
});
