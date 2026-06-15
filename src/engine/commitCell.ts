import { extractDeps } from './formulaParser';
import { evaluateCell } from './formulaEvaluator';
import { wouldCreateCycle, updateEdges, topoOrder } from './dependencyGraph';
import type { CellId } from './types';
import type { AppState } from '../store/storeTypes';

export function commitCell(state: AppState, cellId: CellId, raw: string): AppState {
  const newDeps = raw.startsWith('=')
    ? new Set(extractDeps(raw.slice(1).trim()))
    : new Set<CellId>();

  // reject before touching state if cycle detected
  if (wouldCreateCycle(state.graph, cellId, newDeps)) {
    return {
      ...state,
      cells: {
        ...state.cells,
        [cellId]: { ...state.cells[cellId], error: 'CIRCULAR_REF' },
      },
    };
  }

  const newGraph = updateEdges(state.graph, cellId, newDeps);

  // seed new raw value before re-evaluation
  let cells = {
    ...state.cells,
    [cellId]: { ...state.cells[cellId], raw, error: null, computed: null },
  };

  // re-evaluate in dependency order
  const order = topoOrder(newGraph, cellId);
  for (const id of order) {
    const result = evaluateCell(cells[id].raw, cells);
    cells = {
      ...cells,
      [id]: result.ok
        ? { ...cells[id], computed: result.value, error: null }
        : { ...cells[id], computed: null, error: result.error },
    };
  }

  return { ...state, cells, graph: newGraph };
}
