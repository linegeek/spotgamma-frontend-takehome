export const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] as const;
export const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export const ALL_CELL_IDS: string[] = COLUMNS.flatMap((col) =>
  ROWS.map((row) => `${col}${row}`)
);
