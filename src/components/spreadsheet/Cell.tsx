import { useRef, useState } from 'react';
import { useCellContext } from '../../store/CellContext';
import type { CellError, CellId } from '../../engine/types';
import styles from './Cell.module.css';

const ERROR_DISPLAY: Record<NonNullable<CellError>, string> = {
  CIRCULAR_REF: '#CYCLE!',
  PARSE_ERROR:  '#ERR',
  DIV_ZERO:     '#DIV/0!',
  REF_ERROR:    '#REF!',
  VALUE_ERROR:  '#VALUE!',
};

interface Props {
  cellId: CellId;
}

export function Cell({ cellId }: Props) {
  const { state, dispatch } = useCellContext();
  const cell = state.cells[cellId];
  const isEditing = state.editingCellId === cellId;
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setDraft(cell.raw);
    dispatch({ type: 'SET_EDITING_CELL', cellId });
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  }

  function commit() {
    dispatch({ type: 'COMMIT_CELL', cellId, raw: draft });
    dispatch({ type: 'SET_EDITING_CELL', cellId: null });
  }

  function cancel() {
    dispatch({ type: 'SET_EDITING_CELL', cellId: null });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter')  commit();
    if (e.key === 'Escape') cancel();
  }

  const displayValue = cell.error
    ? ERROR_DISPLAY[cell.error]
    : (cell.computed ?? '');

  return isEditing ? (
    <input
      ref={inputRef}
      className={`${styles.cell} ${styles.editing}`}
      value={draft}
      size={1}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
    />
  ) : (
    <div
      className={`${styles.cell} ${cell.error ? styles.error : ''}`}
      onClick={startEdit}
      title={cell.error ? ERROR_DISPLAY[cell.error] : undefined}
    >
      {displayValue}
    </div>
  );
}
