/**
 * Central type definitions for the voice-driven grid.
 * Strong typing ensures voice parsing and UI stay in sync.
 */

/** One main cell holds 9 sub-cells (3×3). Index 0=top-left, 4=center, 8=bottom-right. */
export type SubCellState = boolean;

/** Grid is 12 columns × 2 rows = 24 main cells; each has 9 sub-cells. */
export const MAIN_COLS = 12;
export const MAIN_ROWS = 2;
export const MAIN_COUNT = MAIN_COLS * MAIN_ROWS; // 24
export const SUB_PER_CELL = 9;
export const SUB_COLS = 3;
export const SUB_ROWS = 3;

/** Full grid state: 24 cells, each with 9 booleans. */
export type GridState = SubCellState[][];

/** Parsed voice command — separation from UI allows testing and clarity. */
export type VoiceCommand =
  | { type: 'nextCell' }
  | { type: 'prevCell' }
  | { type: 'goToCell'; index: number }
  | { type: 'cellNotFound'; requested: number }
  | { type: 'selectSub'; index: number }
  | { type: 'selectSubCells'; indices: number[] }
  | { type: 'toggle' }
  | { type: 'turnOn' }
  | { type: 'turnOff' }
  | null;

/** Focus state: which main cell is active, which sub-cell is focused, which sub-cells are selected (multi). */
export interface GridFocus {
  activeCellIndex: number;
  focusedSubIndex: number | null;
  selectedSubIndices: number[];
}
