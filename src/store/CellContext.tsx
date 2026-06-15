import { createContext, useContext, useReducer } from 'react';
import { cellReducer } from './cellReducer';
import { createInitialState } from '../engine/createInitialState';
import type { AppState } from './storeTypes';
import type { Action } from './actions';

interface CellContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const CellContext = createContext<CellContextValue | null>(null);

export function CellProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cellReducer, undefined, createInitialState);
  return (
    <CellContext.Provider value={{ state, dispatch }}>
      {children}
    </CellContext.Provider>
  );
}

export function useCellContext(): CellContextValue {
  const ctx = useContext(CellContext);
  if (!ctx) throw new Error('useCellContext must be used inside CellProvider');
  return ctx;
}
