import { COLUMNS, ROWS } from '../../constants/grid';
import { ColumnHeader } from './ColumnHeader';
import { RowHeader } from './RowHeader';
import { Cell } from './Cell';
import styles from './SpreadsheetGrid.module.css';

export function SpreadsheetGrid() {
  return (
    <div className={styles.grid}>
      {/* corner */}
      <div className={styles.corner} />

      {/* column headers A–J */}
      {COLUMNS.map((col) => (
        <ColumnHeader key={col} label={col} />
      ))}

      {/* rows: row header + 10 cells */}
      {ROWS.map((row) => (
        <>
          <RowHeader key={`row-${row}`} label={row} />
          {COLUMNS.map((col) => (
            <Cell key={`${col}${row}`} cellId={`${col}${row}`} />
          ))}
        </>
      ))}
    </div>
  );
}
