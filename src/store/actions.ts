import type { CellId } from '../engine/types';

export type Action =
  | { type: 'COMMIT_CELL'; cellId: CellId; raw: string }
  | { type: 'SET_EDITING_CELL'; cellId: CellId | null };
