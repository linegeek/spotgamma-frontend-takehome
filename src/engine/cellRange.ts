import { COLUMNS } from '../constants/grid';
import { isValidCellId, parseCellId } from './cellId';
import type { CellId } from './types';

export function expandRange(start: CellId, end: CellId): CellId[] {
  if (!isValidCellId(start) || !isValidCellId(end)) return [];

  const s = parseCellId(start);
  const e = parseCellId(end);

  const colStart = COLUMNS.indexOf(s.col as typeof COLUMNS[number]);
  const colEnd   = COLUMNS.indexOf(e.col as typeof COLUMNS[number]);
  const rowStart = Math.min(s.row, e.row);
  const rowEnd   = Math.max(s.row, e.row);

  const ids: CellId[] = [];
  for (let c = Math.min(colStart, colEnd); c <= Math.max(colStart, colEnd); c++) {
    for (let r = rowStart; r <= rowEnd; r++) {
      ids.push(`${COLUMNS[c]}${r}`);
    }
  }
  return ids;
}
