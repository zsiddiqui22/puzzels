/**
 * SubCell: one toggle in the 3×3 sub-grid.
 * Large tap target and high-contrast states for accessibility and touch/voice.
 */
import type { SubCellState } from './types';

interface SubCellProps {
  value: SubCellState;
  focused: boolean;
  selected: boolean;
  onToggle: () => void;
  onClick: () => void;
}

export function SubCell({ value, focused, selected, onToggle, onClick }: SubCellProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-selected={selected}
      className={`sub-cell ${value ? 'sub-cell--on' : ''} ${focused ? 'sub-cell--focused' : ''} ${selected ? 'sub-cell--selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
        onToggle();
      }}
      onFocus={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {value ? '✓' : ''}
    </button>
  );
}
