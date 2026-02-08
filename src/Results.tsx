/**
 * Results page: read-only summary of grid data and selections.
 * Shown after user clicks "Next step" on the grid view.
 */
import type { GridState, GridFocus } from './types';
import { MAIN_COUNT, SUB_PER_CELL } from './types';

interface ResultsProps {
  grid: GridState;
  focus: GridFocus;
  onBack: () => void;
}

export function Results({ grid, focus, onBack }: ResultsProps) {
  const { activeCellIndex, selectedSubIndices } = focus;

  return (
    <div className="results">
      <header className="results__header">
        <h1 className="results__title">Results</h1>
        <p className="results__subtitle">Summary of your grid entries</p>
      </header>

      <div className="results__summary">
        <div className="results__card">
          <h2 className="results__card-title">Current cell</h2>
          <p className="results__card-value">Cell {activeCellIndex + 1}</p>
        </div>
        <div className="results__card">
          <h2 className="results__card-title">Selected sub-cells (current cell)</h2>
          <p className="results__card-value">
            {selectedSubIndices.length > 0
              ? selectedSubIndices.map((i) => i + 1).join(', ')
              : 'None'}
          </p>
        </div>
      </div>

      <div className="results__grid-summary">
        <h2 className="results__section-title">Grid state (on = ✓)</h2>
        <div className="results__table-wrap">
          <table className="results__table">
            <thead>
              <tr>
                <th>Cell</th>
                {Array.from({ length: SUB_PER_CELL }, (_, i) => (
                  <th key={i}>{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: MAIN_COUNT }, (_, cellIdx) => (
                <tr key={cellIdx}>
                  <td className="results__cell-num">{cellIdx + 1}</td>
                  {Array.from({ length: SUB_PER_CELL }, (_, subIdx) => (
                    <td
                      key={subIdx}
                      className={`results__cell-state ${grid[cellIdx]?.[subIdx] ? 'results__cell-state--on' : ''}`}
                    >
                      {grid[cellIdx]?.[subIdx] ? '✓' : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="results__actions">
        <button type="button" className="btn btn--secondary" onClick={onBack}>
          Back to grid
        </button>
      </div>
    </div>
  );
}
