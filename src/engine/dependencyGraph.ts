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
