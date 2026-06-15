import type { CellId, DependencyGraph } from './types';

export function createEmptyGraph(): DependencyGraph {
  return { depsOf: {}, dependentsOf: {} };
}

export function updateEdges(
  graph: DependencyGraph,
  cellId: CellId,
  newDeps: Set<CellId>,
): DependencyGraph {
  const depsOf       = { ...graph.depsOf };
  const dependentsOf = { ...graph.dependentsOf };

  // remove old reverse edges
  for (const oldDep of depsOf[cellId] ?? []) {
    const prev = new Set(dependentsOf[oldDep] ?? []);
    prev.delete(cellId);
    dependentsOf[oldDep] = prev;
  }

  // write new forward edges
  depsOf[cellId] = new Set(newDeps);

  // write new reverse edges
  for (const dep of newDeps) {
    const next = new Set(dependentsOf[dep] ?? []);
    next.add(cellId);
    dependentsOf[dep] = next;
  }

  return { depsOf, dependentsOf };
}

function canReach(graph: DependencyGraph, from: CellId, target: CellId): boolean {
  const visited = new Set<CellId>();
  const stack = [from];
  while (stack.length) {
    const node = stack.pop()!;
    if (node === target) return true;
    if (visited.has(node)) continue;
    visited.add(node);
    for (const dep of graph.depsOf[node] ?? []) {
      stack.push(dep);
    }
  }
  return false;
}

export function wouldCreateCycle(
  graph: DependencyGraph,
  target: CellId,
  newDeps: Set<CellId>,
): boolean {
  for (const dep of newDeps) {
    if (canReach(graph, dep, target)) return true;
  }
  return false;
}

export function topoOrder(graph: DependencyGraph, changed: CellId): CellId[] {
  // collect changed cell and all downstream dependents
  const affected = new Set<CellId>();
  const queue = [changed];
  while (queue.length) {
    const id = queue.shift()!;
    if (affected.has(id)) continue;
    affected.add(id);
    for (const dep of graph.dependentsOf[id] ?? []) queue.push(dep);
  }

  // Kahn's algorithm — deps always before dependents
  const inDegree: Record<string, number> = {};
  for (const id of affected) inDegree[id] = 0;
  for (const id of affected) {
    for (const dep of graph.depsOf[id] ?? []) {
      if (affected.has(dep)) inDegree[id]++;
    }
  }

  const ready = Object.keys(inDegree).filter((id) => inDegree[id] === 0);
  const order: CellId[] = [];

  while (ready.length) {
    const id = ready.shift()!;
    order.push(id);
    for (const dependent of graph.dependentsOf[id] ?? []) {
      if (!affected.has(dependent)) continue;
      inDegree[dependent]--;
      if (inDegree[dependent] === 0) ready.push(dependent);
    }
  }

  return order;
}
