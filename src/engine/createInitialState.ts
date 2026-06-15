import { ALL_CELL_IDS } from '../constants/grid';
import { createEmptyGraph } from './dependencyGraph';
import type { CellStore } from './types';
import type { AppState } from '../store/storeTypes';

export function createInitialState(): AppState {
  const cells: CellStore = Object.fromEntries(
    ALL_CELL_IDS.map((id) => [id, { raw: '', computed: null, error: null }])
  );

  return {
    cells,
    graph: createEmptyGraph(),
    editingCellId: null,
  };
}
