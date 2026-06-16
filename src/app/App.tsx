import { CellProvider } from '../store/CellContext';
import { SpreadsheetGrid } from '../components/spreadsheet/SpreadsheetGrid';

export function App() {
  return (
    <CellProvider>
      <header style={{ padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: '#3c4043' }}>SpotGamma — Live Matrix</h1>
      </header>
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <SpreadsheetGrid />
      </div>
    </CellProvider>
  );
}
