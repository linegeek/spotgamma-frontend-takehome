import type { CellId } from './types';

const CELL_ID_RE = /^[A-J](10|[1-9])$/;

export function isValidCellId(id: string): id is CellId {
  return CELL_ID_RE.test(id);
}

export function parseCellId(id: CellId): { col: string; row: number } {
  return { col: id[0], row: parseInt(id.slice(1), 10) };
}
