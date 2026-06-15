# Decision Log

## Why These Technologies

### React 18 + TypeScript

TypeScript is non-negotiable for a project like this — cell IDs, the dependency graph, and the formula evaluator all deal with string-keyed maps and discriminated unions where a type error at compile time is far cheaper than a silent bug in the spreadsheet engine at runtime.

### Vite

No meaningful alternative for a greenfield React + TypeScript project in 2025. Create React App is unmaintained. Vite gives sub-second cold starts, fast HMR, and a zero-config build output that works cleanly with `gh-pages`.

### useReducer + useContext (not Redux, not Zustand, not Jotai)

The state shape is a single flat object: 100 cells and a dependency graph. There is one meaningful action (`COMMIT_CELL`) and one UI action (`SET_EDITING_CELL`). Redux would add a store configuration file, a provider setup, and selector boilerplate for no additional capability. Zustand would add an external dependency and a different mental model. Jotai's derived atoms require knowing dependencies at atom definition time, which is impossible when dependencies come from user-typed formulas at runtime.

`useReducer` is Redux's core pattern — action dispatched, reducer returns new state — without the overhead. For 100 cells and two action types, it is the correct tool.

### CSS Grid (no UI library)

The assignment explicitly specifies CSS Grid. Using a component library like MUI or Chakra would abstract away the layout in a way that makes the implementation harder to evaluate. Plain CSS Modules keep styles colocated with components and produce no runtime overhead.

### Vitest (not Jest)

Vitest shares Vite's config and transform pipeline. No separate Babel config, no `ts-jest`, no mismatched module resolution. The engine modules (parser, graph, evaluator) have zero React imports and run as plain Node modules under Vitest with no JSDOM required.

### gh-pages

Required by the assignment spec. `vite build` produces a static `dist/` folder that `gh-pages -d dist` deploys directly to the `gh-pages` branch.

---

## Important Architectural Decisions

### Engine and UI are strictly separated

All spreadsheet logic lives in `src/engine/` with no React imports. The engine is a set of pure functions that take state in and return new state out. React is only responsible for rendering and dispatching.

This was a deliberate choice, not a convenience. It means:
- Every engine function can be unit tested without mounting a component
- The engine can be extracted and reused (e.g., in a Node.js server for future collaborative features)
- Bugs in formula evaluation are never entangled with rendering bugs

### commitCell is a pure function

`commitCell(state, cellId, raw)` returns a new `AppState` and never mutates the old one. This is the single most important constraint in the codebase. It means the reducer is deterministic and the engine is side-effect free — the same input always produces the same output.

### Cycle detection runs before state mutation

The dependency graph is only updated if the proposed formula is proven safe. If a cycle is detected, the old `raw` and `computed` values are preserved and only the `error` field is set on the cell. The graph never enters an inconsistent state.

### Two-direction dependency graph

`depsOf` and `dependentsOf` are both maintained. This is a deliberate space-for-time trade: keeping both directions means cycle detection (walk `depsOf` backward to the target) and downstream recalculation (walk `dependentsOf` forward) are both O(V+E) without re-scanning the grid.

### CellStore uses Record, not Map

`Record<CellId, Cell>` spreads and merges cleanly with the object spread operator inside the reducer, which aligns with React's immutable update pattern. `Map` requires explicit copying (`new Map(old)`) and does not serialize to JSON without custom handling — relevant if state persistence is added later.

### EvalResult discriminated union

Formula evaluation returns `{ ok: true, value }` or `{ ok: false, error }` — it never throws. This keeps error handling explicit and ensures formula errors are data, not exceptions. React components never need a try/catch around display logic.

---

## Future Improvements

### Real-time collaborative editing

The most significant planned extension is allowing multiple users to edit the grid simultaneously — one user edits one cell while another edits a different cell, with changes propagating to all connected clients in real time.

### Formula language extensions

- `AVERAGE(A1:A10)`, `MIN`, `MAX`, `COUNT` — range aggregates beyond `SUM`
- String functions: `CONCAT`, `LEN`, `UPPER`
- Conditional: `IF(A1 > 0, "pos", "neg")`

These are additive changes to `formulaParser.ts` and `formulaEvaluator.ts` only — no changes to the graph or commit flow.

### Undo / redo

Because `commitCell` is pure and the reducer always produces a new state object, undo/redo is straightforward: maintain a stack of past `AppState` snapshots and expose `UNDO` / `REDO` actions in the reducer. No third-party library needed.

### Cell formatting

Bold, italic, text colour, number format (currency, percentage, decimal places). These are display-only properties that sit alongside `raw`, `computed`, and `error` in the `Cell` interface. They do not affect the engine at all.

### Persistent state

Serialise `CellStore` to `localStorage` on every commit. On load, rehydrate state and re-run the full topological evaluation pass to rebuild `computed` values. The `DependencyGraph` can also be serialised by converting each `Set` to an array.

### Variable grid size

`COLUMNS` and `ROWS` in `src/constants/grid.ts` already drive all cell generation. Supporting a configurable grid size is a one-line change to those constants plus a CSS Grid column/row count update.
