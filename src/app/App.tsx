import { CellProvider } from '../store/CellContext';
import { SpreadsheetGrid } from '../components/spreadsheet/SpreadsheetGrid';

export function App() {
  return (
    <CellProvider>
      <h1 style={{ marginBottom: 24, fontSize: 18, fontWeight: 600, color: '#3c4043' }}>
        SpotGamma — Live Matrix
      </h1>
      <SpreadsheetGrid />
    </CellProvider>
  );
}
