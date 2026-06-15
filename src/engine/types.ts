export type CellId = string;

export type CellValue = string | number | null;

export type CellError =
  | 'CIRCULAR_REF'
  | 'PARSE_ERROR'
  | 'DIV_ZERO'
  | 'REF_ERROR'
  | 'VALUE_ERROR'
  | null;

export interface Cell {
  raw: string;
  computed: CellValue;
  error: CellError;
}

export type CellStore = Record<CellId, Cell>;

export interface DependencyGraph {
  depsOf: Record<CellId, Set<CellId>>;
  dependentsOf: Record<CellId, Set<CellId>>;
}

export type EvalResult =
  | { ok: true; value: CellValue }
  | { ok: false; error: CellError };
