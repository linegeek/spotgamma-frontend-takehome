# Architecture: Live-Calculating Matrix UI

## Overview

A 10×10 spreadsheet engine built in React 18 + TypeScript, deployed to GitHub Pages via `gh-pages`. The design strictly separates a **pure TypeScript engine layer** from the **React UI layer**. The engine has no React imports and can be tested entirely with Vitest and no JSDOM.

---

## 1. Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Layout | CSS Grid |
| Testing | Vitest |
| Deploy | gh-pages |

---

## 2. Folder Structure

```
src/
├── app/
│   └── App.tsx
│
├── components/
│   └── spreadsheet/
│       ├── SpreadsheetGrid.tsx
│       ├── SpreadsheetGrid.module.css
│       ├── Cell.tsx
│       ├── Cell.module.css
│       ├── ColumnHeader.tsx
│       └── RowHeader.tsx
│
├── engine/
│   ├── cellId.ts             ← parse, validate, format cell IDs
│   ├── cellRange.ts          ← expand A1:A5 into [A1, A2, A3, A4, A5]
│   ├── formulaParser.ts      ← tokenizer + recursive-descent parser
│   ├── formulaEvaluator.ts   ← evaluate a parsed formula against CellStore
│   ├── dependencyGraph.ts    ← cycle detection + topological sort
│   ├── commitCell.ts         ← pure commit orchestrator
│   ├── createInitialState.ts ← build the blank 10×10 AppState
│   └── types.ts              ← domain-only spreadsheet types
│
├── store/
│   ├── CellContext.tsx       ← React Context + Provider + hook
│   ├── cellReducer.ts        ← useReducer reducer
│   ├── actions.ts            ← Action type union
│   └── storeTypes.ts         ← AppState (React/store level)
│
├── constants/
│   └── grid.ts               ← COLUMNS, ROWS, ALL_CELL_IDS
│
├── styles/
│   └── global.css
│
└── main.tsx
```

---

## 3. Core Data Model

### `src/engine/types.ts` — domain types only, no React imports

```ts
export type CellId = string; // "A1", "B3", "J10"

export type CellValue = string | number | null;

export type CellError =
  | 'CIRCULAR_REF'
  | 'PARSE_ERROR'
  | 'DIV_ZERO'
  | 'REF_ERROR'
  | 'VALUE_ERROR'
  | null;

export interface Cell {
  raw: string;         // exact text typed by the user: "42", "hello", "=A1+B1"
  computed: CellValue; // evaluated display value: 42, "hello", null
  error: CellError;    // null means the cell is valid
}

export type CellStore = Record<CellId, Cell>;

export interface DependencyGraph {
  // depsOf["C1"] = Set(["A1", "B1"]) — C1 depends on A1 and B1
  depsOf: Record<CellId, Set<CellId>>;

  // dependentsOf["A1"] = Set(["C1"]) — C1 depends on A1
  dependentsOf: Record<CellId, Set<CellId>>;
}
```

### `src/store/storeTypes.ts` — React/store state, imports engine types

```ts
import type { CellId, CellStore, DependencyGraph } from '../engine/types';

export interface AppState {
  cells: CellStore;
  graph: DependencyGraph;
  editingCellId: CellId | null;
}
```

The split ensures the engine is fully portable and testable without React.

---

## 4. Cell ID System

### `src/constants/grid.ts`

```ts
export const COLUMNS = ['A','B','C','D','E','F','G','H','I','J'] as const;
export const ROWS    = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]          as const;

export const ALL_CELL_IDS = COLUMNS.flatMap((col) =>
  ROWS.map((row) => `${col}${row}`)
); // 100 IDs: "A1" … "J10"
```

### `src/engine/cellId.ts`

Valid cell references are A–J, rows 1–10 only.

```ts
const CELL_ID_RE = /^[A-J](10|[1-9])$/;

export function isValidCellId(id: string): boolean {
  return CELL_ID_RE.test(id);
}
```

---

## 5. Grid Rendering

The grid uses CSS Grid with an explicit corner cell, column headers, row headers, and 100 editable cells.

```css
/* SpreadsheetGrid.module.css */
.grid {
  display: grid;
  grid-template-columns: 48px repeat(10, 1fr); /* row-label col + 10 data cols */
  grid-template-rows: 32px repeat(10, 40px);   /* header row + 10 data rows    */
}
```

Render order:

1. Empty corner cell (top-left)
2. 10 `<ColumnHeader>` cells — A through J
3. For each row 1–10: one `<RowHeader>` then 10 `<Cell>` components

---

## 6. Formula Parser

### `src/engine/formulaParser.ts`

A hand-rolled **recursive-descent parser** — no external library. The parser has two jobs:

1. **Extract dependencies** — collect all cell references without evaluating (used before cycle detection)
2. **Evaluate** — compute the formula result given the current `CellStore`

#### Supported syntax

```
=A1 + B2
=A1 - B1
=A1 * B1
=A1 / B1
=SUM(A1:A5)
=(A1 + B1) * 2
```

#### Grammar

```
expr     → term (('+' | '-') term)*
term     → factor (('*' | '/') factor)*
factor   → NUMBER | cell_ref | sum_fn | '(' expr ')'
cell_ref → [A-J](10|[1-9])
sum_fn   → 'SUM' '(' cell_ref ':' cell_ref ')'
```

#### Plain-value rule

If `raw` does not start with `=`, it is not parsed as a formula:

```
"42"    → computed: 42      (parsed as number)
"hello" → computed: "hello" (stored as string)
"=A1"   → computed: formula result
```

#### Evaluation result type

Formula evaluation never throws. It returns a discriminated union:

```ts
type EvalResult =
  | { ok: true;  value: CellValue }
  | { ok: false; error: CellError };
```

| Condition | Error |
|---|---|
| Invalid syntax | `PARSE_ERROR` |
| Division by zero | `DIV_ZERO` |
| Referencing an errored cell | `REF_ERROR` |
| Non-numeric text in arithmetic | `VALUE_ERROR` |

---

## 7. Dependency Graph

### `src/engine/dependencyGraph.ts`

Two directed adjacency lists are maintained in sync at all times:

```
depsOf["C1"]        = Set(["A1", "B1"])   — C1 depends on A1 and B1
dependentsOf["A1"]  = Set(["C1"])         — A1 is needed by C1
dependentsOf["B1"]  = Set(["C1"])         — B1 is needed by C1
```

**Why both directions?**
- `depsOf` is used during **cycle detection** — walk from proposed dependencies back toward the target cell.
- `dependentsOf` is used during **recalculation** — walk forward to collect all cells that must be re-evaluated.

---

## 8. Commit Flow

### `src/engine/commitCell.ts`

`commitCell` is a **pure function** — no DOM access, no React imports, no mutation of the old state object. It always returns a new `AppState`.

```
commitCell(state, cellId, rawInput):

  1. Parse rawInput → extract dependency set (refs and ranges)

  2. Build a temporary graph:
       - remove old depsOf[cellId] edges
       - add new dependency edges for cellId

  3. Check wouldCreateCycle(tempGraph, cellId, newDeps)

  4. If CYCLE:
       - return state with cells[cellId].error = 'CIRCULAR_REF'
       - raw and computed remain at their previous stable values
       - graph is not updated

  5. If SAFE:
       - commit newGraph (immutable new Record + Set copies)
       - save cells[cellId].raw = rawInput
       - collect downstream cells via dependentsOf (BFS/DFS)
       - topologically sort: dependencies always evaluated before dependents
       - re-evaluate each cell in sorted order using the current CellStore
       - accumulate results into a new cells Record

  6. Return one new AppState object with updated cells and graph
```

A single dispatch covers the full propagation wave — React sees one state update.

---

## 9. Cycle Detection

### Algorithm: DFS from each proposed dependency toward the target

Before committing, for each cell in `newDeps`, walk the **existing** `depsOf` edges. If that walk can reach `target`, the new formula would create a cycle.

```ts
function wouldCreateCycle(
  graph: DependencyGraph,
  target: CellId,
  newDeps: Set<CellId>
): boolean {
  for (const dep of newDeps) {
    if (canReach(graph, dep, target)) return true;
  }
  return false;
}
```

`canReach` is a standard DFS over `depsOf`. It runs on the **proposed** (not yet committed) graph, so a detected cycle never touches the real state.

**Example:**

```
A1 = =B1   (A1 depends on B1)
User types =A1 into B1

target  = B1
newDeps = { A1 }

canReach(graph, A1, B1)?
  A1 depends on B1 → yes → cycle detected → reject
```

---

## 10. Recalculation Strategy

After a valid commit, only the edited cell and its downstream dependents are recalculated.

**Example chain:**

```
A1 = 10
B1 = =A1 + 5    → depends on A1
C1 = =B1 * 2    → depends on B1
```

When A1 changes:
1. Collect downstream: `{ B1, C1 }` via `dependentsOf`
2. Topological sort: `[A1, B1, C1]` — each cell's dependencies are fully evaluated before it is
3. Re-evaluate in order: A1 → B1 → C1
4. Return updated CellStore in one new state object

---

## 11. State Management

### `src/store/actions.ts`

```ts
import type { CellId } from '../engine/types';

export type Action =
  | { type: 'COMMIT_CELL';      cellId: CellId; raw: string }
  | { type: 'SET_EDITING_CELL'; cellId: CellId | null };
```

### `src/store/cellReducer.ts`

```ts
import { commitCell }  from '../engine/commitCell';
import type { AppState } from './storeTypes';
import type { Action }   from './actions';

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
```

### `src/store/CellContext.tsx`

Provides `state` and `dispatch` via React Context. Consumed by `<Cell>` components through a typed `useCellContext` hook.

---

## 12. Cell UI Behaviour

### Two modes

| Mode | Element | Shows |
|---|---|---|
| Display | `<div>` | `computed` value, or error string if `error` is set |
| Edit | `<input>` | `raw` string (the formula or literal as typed) |

### Mode transitions

| Action | Result |
|---|---|
| Click cell | Enter edit mode |
| Enter key | Commit → display mode |
| Blur | Commit → display mode |
| Escape | Cancel → display mode, raw unchanged |

### Error display strings

| `CellError` | Displayed as |
|---|---|
| `CIRCULAR_REF` | `#CYCLE!` |
| `PARSE_ERROR` | `#ERR` |
| `DIV_ZERO` | `#DIV/0!` |
| `REF_ERROR` | `#REF!` |
| `VALUE_ERROR` | `#VALUE!` |

---

## 13. React Rendering Strategy

Keep it simple. For 100 cells, correctness matters more than micro-optimised rendering.

`useReducer` + `useContext` is sufficient. All cell components may re-render when state changes — this is acceptable because:

- React components **re-render** (virtual DOM diff)
- The **real DOM** only updates where computed values actually changed

`React.memo` on `<Cell>` is optional. It can skip the virtual DOM diff for unchanged cells, but is not required for correctness.

Do not reach for Zustand, Jotai, or per-cell subscriptions. The plain reducer model keeps all state transitions in one auditable place and matches the scale of this assignment.

---

## 14. Error Handling

Formula evaluation never throws into React rendering. Every error path inside the engine returns an `EvalResult` value:

```ts
type EvalResult =
  | { ok: true;  value: CellValue }
  | { ok: false; error: CellError };
```

`commitCell` maps `EvalResult` onto the `Cell.error` field. The UI reads that field and renders the appropriate error string. No `try/catch` is needed in components.

---

## 15. Deployment

```
vite.config.ts   →  base: '/spotgamma-frontend-takehome/'
package.json     →  "predeploy": "npm run build"
                    "deploy":    "gh-pages -d dist"
```

`npm run deploy` builds the project and pushes `dist/` to the `gh-pages` branch.

Live URL: `https://<github_name>.github.io/spotgamma-frontend-takehome/`

---

## 16. Testing Strategy

| Layer | What to test |
|---|---|
| `cellId.ts` | Valid and invalid cell ID strings |
| `cellRange.ts` | Range expansion: A1:A5 → [A1,A2,A3,A4,A5], column and row ranges |
| `formulaParser.ts` | Literals, cell refs, SUM ranges, arithmetic, nested parens, invalid syntax |
| `dependencyGraph.ts` | Direct cycle, indirect cycle (A→B→C→A), no false positives on valid graphs |
| `commitCell.ts` | Single cell, chain propagation, cycle rejection preserving old value |
| `<Cell />` | Display/edit toggle, error string rendering, keyboard interactions |

Engine modules have zero React imports — all engine tests run with plain Vitest, no JSDOM required.
