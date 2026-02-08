/**
 * Cell: one main cell in the 12×2 grid, containing a 3×3 sub-grid.
 * Clearly highlights active (main) and focused sub-cell for voice feedback.
 */
import { SubCell } from './SubCell';
import type { SubCellState } from './types';
import { SUB_COLS, SUB_ROWS } from './types';

interface CellProps {
  cellIndex: number;
  values: SubCellState[];
  isActive: boolean;
  focusedSubIndex: number | null;
  selectedSubIndices: number[];
  isFlashing: boolean;
  onCellClick: () => void;
  onSubClick: (subIndex: number) => void;
  onSubFocus: (subIndex: number) => void;
  onSubToggle: (subIndex: number) => void;
}

export function Cell({
  cellIndex,
  values,
  isActive,
  focusedSubIndex,
  selectedSubIndices,
  isFlashing,
  onCellClick,
  onSubClick,
  onSubFocus,
  onSubToggle,
}: CellProps) {
  return (
    <div
      role="gridcell"
      aria-label={`Cell ${cellIndex + 1}`}
      className={`cell ${isActive ? 'cell--active' : ''} ${isFlashing ? 'cell--flash' : ''}`}
      onClick={onCellClick}
      tabIndex={-1}
    >
      <div className="cell__sub-grid" role="group" aria-label="Sub-cells">
        {Array.from({ length: SUB_ROWS * SUB_COLS }, (_, i) => (
          <SubCell
            key={i}
            value={values[i] ?? false}
            focused={focusedSubIndex === i}
            selected={selectedSubIndices.includes(i)}
            onToggle={() => onSubToggle(i)}
            onClick={() => {
              onSubClick(i);
              onSubFocus(i);
            }}
          />
        ))}
      </div>
    </div>
  );
}
