import { commitCell } from '../engine/commitCell';
import type { AppState } from './storeTypes';
import type { Action } from './actions';

export function cellReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'COMMIT_CELL':
      return commitCell(state, action.cellId, action.raw);
    case 'SET_EDITING_CELL':
      return { ...state, editingCellId: action.cellId };
    default:
      return state;
  }
}
