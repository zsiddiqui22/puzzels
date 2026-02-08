/**
 * Grid: 12×2 main grid with keyboard navigation (arrows, Enter, Space).
 * Arrow keys move active cell; Enter/Space toggle focused sub-cell for fallback UX.
 */
import { useEffect } from 'react';
import { Cell } from './Cell';
import type { GridState, GridFocus } from './types';
import { MAIN_COLS, MAIN_ROWS, MAIN_COUNT } from './types';

interface GridProps {
  grid: GridState;
  focus: GridFocus;
  lastCommandFlash: boolean;
  setActiveCell: (index: number) => void;
  setFocusedSub: (index: number | null) => void;
  toggleSub: (cellIndex: number, subIndex: number, value?: boolean) => void;
}

export function Grid({
  grid,
  focus,
  lastCommandFlash,
  setActiveCell,
  setFocusedSub,
  toggleSub,
}: GridProps) {
  const { activeCellIndex, focusedSubIndex, selectedSubIndices } = focus;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          setActiveCell(activeCellIndex + 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setActiveCell(activeCellIndex - 1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setActiveCell(activeCellIndex + MAIN_COLS);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveCell(activeCellIndex - MAIN_COLS);
          break;
        case 'Enter':
        case ' ':
          if (focusedSubIndex !== null) {
            e.preventDefault();
            toggleSub(activeCellIndex, focusedSubIndex);
          }
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeCellIndex, focusedSubIndex, setActiveCell, toggleSub]);

  return (
    <div
      className="grid"
      role="grid"
      aria-label="Voice data grid"
      tabIndex={0}
    >
      {Array.from({ length: MAIN_ROWS * MAIN_COLS }, (_, i) => (
        <Cell
          key={i}
          cellIndex={i}
          values={grid[i] ?? []}
          isActive={i === activeCellIndex}
          focusedSubIndex={i === activeCellIndex ? focusedSubIndex : null}
          selectedSubIndices={i === activeCellIndex ? selectedSubIndices : []}
          isFlashing={i === activeCellIndex && lastCommandFlash}
          onCellClick={() => setActiveCell(i)}
          onSubClick={(subIndex) => {
            setActiveCell(i);
            setFocusedSub(subIndex);
          }}
          onSubFocus={(subIndex) => setFocusedSub(subIndex)}
          onSubToggle={(subIndex) => toggleSub(i, subIndex)}
        />
      ))}
    </div>
  );
}
