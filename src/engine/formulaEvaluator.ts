import { parseFormula } from './formulaParser';
import type { CellId, CellStore, CellValue, EvalResult } from './types';

function resolveNumeric(cellId: CellId, cells: CellStore): number {
  const cell = cells[cellId];
  if (!cell || cell.error) throw new Error('REF_ERROR');
  const v = cell.computed;
  if (v === null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    if (v === '') return 0;
    const n = Number(v);
    if (!isNaN(n)) return n;
    throw new Error('VALUE_ERROR');
  }
  throw new Error('VALUE_ERROR');
}

export function evaluateCell(raw: string, cells: CellStore): EvalResult {
  if (!raw.startsWith('=')) {
    const n = Number(raw);
    const value: CellValue = raw === '' ? null : isNaN(n) ? raw : n;
    return { ok: true, value };
  }

  const formula = raw.slice(1).trim();

  try {
    const fn = parseFormula(formula);
    const proxy = new Proxy({} as Record<CellId, number>, {
      get(_, key: string) { return resolveNumeric(key as CellId, cells); },
      has(_, key: string) { return key in cells; },
    });
    return { ok: true, value: fn(proxy) };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'DIV_ZERO')    return { ok: false, error: 'DIV_ZERO' };
    if (msg === 'REF_ERROR')   return { ok: false, error: 'REF_ERROR' };
    if (msg === 'VALUE_ERROR') return { ok: false, error: 'VALUE_ERROR' };
    return { ok: false, error: 'PARSE_ERROR' };
  }
}
