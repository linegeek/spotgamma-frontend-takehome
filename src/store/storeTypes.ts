import type { CellId, CellStore, DependencyGraph } from '../engine/types';

export interface AppState {
  cells: CellStore;
  graph: DependencyGraph;
  editingCellId: CellId | null;
}
