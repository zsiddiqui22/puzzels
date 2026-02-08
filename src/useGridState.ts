/**
 * Centralized grid state: data + focus.
 * Single source of truth so voice and keyboard/mouse stay in sync.
 */
import { useCallback, useMemo, useState } from 'react';
import type { GridState, GridFocus } from './types';
import { MAIN_COUNT, SUB_PER_CELL } from './types';

function createInitialGrid(): GridState {
  return Array.from({ length: MAIN_COUNT }, () => Array(SUB_PER_CELL).fill(false));
}

export function useGridState() {
  const [grid, setGrid] = useState<GridState>(createInitialGrid);
  const [focus, setFocus] = useState<GridFocus>({
    activeCellIndex: 0,
    focusedSubIndex: null,
    selectedSubIndices: [],
  });
  const [lastCommandFlash, setLastCommandFlash] = useState(false);

  const setActiveCell = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(MAIN_COUNT - 1, index));
    setFocus((f) => ({ ...f, activeCellIndex: clamped, focusedSubIndex: null, selectedSubIndices: [] }));
  }, []);

  const setFocusedSub = useCallback((subIndex: number | null) => {
    if (subIndex !== null && (subIndex < 0 || subIndex >= SUB_PER_CELL)) return;
    setFocus((f) => ({ ...f, focusedSubIndex: subIndex }));
  }, []);

  const setSelectedSubIndices = useCallback((indices: number[]) => {
    const valid = indices.filter((i) => i >= 0 && i < SUB_PER_CELL);
    setFocus((f) => ({ ...f, selectedSubIndices: valid }));
  }, []);

  const toggleSub = useCallback((cellIndex: number, subIndex: number, value?: boolean) => {
    setGrid((g) => {
      const next = g.map((row, i) =>
        i === cellIndex ? row.map((v, j) => (j === subIndex ? value ?? !v : v)) : row
      );
      return next;
    });
  }, []);

  const triggerCommandFlash = useCallback(() => {
    setLastCommandFlash(true);
    const t = setTimeout(() => setLastCommandFlash(false), 400);
    return () => clearTimeout(t);
  }, []);

  const applyVoiceCommand = useCallback(
    (cellIndex: number, subIndex: number | null, type: 'toggle' | 'turnOn' | 'turnOff') => {
      // If no sub focused, apply to whole cell (all 9 sub-cells) for "toggle/on/off"
      if (subIndex === null) {
        for (let i = 0; i < SUB_PER_CELL; i++) {
          const next = type === 'toggle' ? undefined : type === 'turnOn';
          toggleSub(cellIndex, i, next);
        }
      } else {
        const next = type === 'toggle' ? undefined : type === 'turnOn';
        toggleSub(cellIndex, subIndex, next);
      }
      triggerCommandFlash();
    },
    [toggleSub, triggerCommandFlash]
  );

  return useMemo(
    () => ({
      grid,
      focus,
      lastCommandFlash,
      setActiveCell,
      setFocusedSub,
      setSelectedSubIndices,
      toggleSub,
      triggerCommandFlash,
      applyVoiceCommand,
    }),
    [
      grid,
      focus,
      lastCommandFlash,
      setActiveCell,
      setFocusedSub,
      setSelectedSubIndices,
      toggleSub,
      triggerCommandFlash,
      applyVoiceCommand,
    ]
  );
}
