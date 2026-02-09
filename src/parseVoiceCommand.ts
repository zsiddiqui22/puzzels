/**
 * Forgiving voice command parser.
 * Normalizes text (lowercase, trim) and matches variations so minor speech errors don't block UX.
 */
import type { VoiceCommand } from './types';
import { MAIN_COUNT } from './types';

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

/** Map spoken position to sub-cell index (1–9 or top/center/bottom left|center|right). */
function parseSubCellPosition(text: string): number | null {
  const n = normalize(text);
  // Numeric: "select 1" … "select 9"
  const numMatch = n.match(/\b(?:select\s+)?([1-9])\b/);
  if (numMatch) return Math.min(9, Math.max(1, parseInt(numMatch[1], 10))) - 1;

  // Named positions (forgiving): top left = 0, top center = 1, top right = 2, etc.
  const posMap: Record<string, number> = {
    'top left': 0, 'top center': 1, 'top right': 2,
    'middle left': 3, 'center': 4, 'middle right': 5,
    'bottom left': 6, 'bottom center': 7, 'bottom right': 8,
    'left': 0, 'right': 2, 'middle': 4,
  };
  for (const [key, idx] of Object.entries(posMap)) {
    if (n.includes(key)) return idx;
  }
  return null;
}

/** Parse cell/block number from "cell 5", "block 5", "go to block 12", "row 1 column 3", etc. */
function parseCellNumber(text: string): number | null {
  const n = normalize(text);
  // "cell 5" / "block 5" / "go to cell 5" / "go to block 5"
  const cellMatch = n.match(/\b(?:go\s+to\s+)?(?:cell|block)\s+(\d{1,2})\b/);
  if (cellMatch) {
    const num = parseInt(cellMatch[1], 10);
    if (num >= 1 && num <= MAIN_COUNT) return num - 1; // 1-based to 0-based
  }
  // "row 1 column 3" for 12×2 grid: row 1 col 3 => index (1-1)*12 + (3-1) = 2
  const rowColMatch = n.match(/\brow\s+(\d)\s+col(?:umn)?\s+(\d+)\b/);
  if (rowColMatch) {
    const row = parseInt(rowColMatch[1], 10);
    const col = parseInt(rowColMatch[2], 10);
    if (row >= 1 && row <= 2 && col >= 1 && col <= 12) return (row - 1) * 12 + (col - 1);
  }
  return null;
}

export function parseVoiceCommand(transcript: string): VoiceCommand {
  if (!transcript || typeof transcript !== 'string') return null;
  const n = normalize(transcript);

  // Navigation: next / previous cell
  if (/\b(?:next|go\s+to\s+next)\s+cell\b/.test(n) || n === 'next') return { type: 'nextCell' };
  if (/\b(?:previous|prev|go\s+to\s+previous)\s+cell\b/.test(n) || n === 'previous' || n === 'prev') return { type: 'prevCell' };

  // "Select block 5" / "select block number 5" (or "select cell 5") — select that main cell; if out of range, report not found
  const selectCellMatch = n.match(/\bselect\s+(?:block|cell)\s+(?:number\s+)?(\d{1,2})\b/);
  if (selectCellMatch) {
    const requested = parseInt(selectCellMatch[1], 10);
    if (requested >= 1 && requested <= MAIN_COUNT) return { type: 'goToCell', index: requested - 1 };
    return { type: 'cellNotFound', requested };
  }

  // Toggle the selected block's checkbox: "toggle cell 1" or "toggle cell one" … "toggle cell 9" / "nine" (do not go to block N)
  const toggleSubCellMatch = n.match(/\btoggle\s+cell\s+(?:number\s+)?([1-9]|one|two|three|four|five|six|seven|eight|nine)\b/);
  if (toggleSubCellMatch) {
    const wordOrDigit = toggleSubCellMatch[1].toLowerCase();
    const digitMap: Record<string, number> = {
      one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
    };
    const num = digitMap[wordOrDigit] ?? parseInt(wordOrDigit, 10);
    const subIndex = Math.max(0, Math.min(8, num - 1));
    return { type: 'applyToSub', subIndex, action: 'toggle' };
  }

  // Go to specific cell (e.g. "go to cell 5", "cell 12")
  const cellNum = parseCellNumber(transcript);
  if (cellNum !== null) return { type: 'goToCell', index: cellNum };

  /** Parse "4, 5 and 6" or "4 5 6" → 0-based indices [3,4,5]. */
  function parseSubCellList(rest: string): number[] {
    const normalized = rest.replace(/\band\b/g, ' ').replace(/,/g, ' ');
    const numbers = normalized.match(/\b[1-9]\b/g);
    if (!numbers || numbers.length === 0) return [];
    return [...new Set(numbers.map((x) => parseInt(x, 10) - 1))].sort((a, b) => a - b);
  }

  // Multi sub-cell selection only: "select sub cell 4, 5 and 6" / "select subcell 4 5 6" / "select sub cells 4 5 6" → indices 3,4,5 (0-based)
  const subCellsMatch = n.match(/\bselect\s+(?:sub\s+cells?|subcells?)\s+([\d\s, and]+)/);
  if (subCellsMatch) {
    const indices = parseSubCellList(subCellsMatch[1]);
    if (indices.length > 0) return { type: 'selectSubCells', indices };
  }

  // Sub-cell selection (e.g. "select center", "select 5" for single sub-cell 5)
  if (n.includes('select')) {
    const subIdx = parseSubCellPosition(transcript);
    if (subIdx !== null) return { type: 'selectSub', index: subIdx };
  }

  // Check / uncheck / toggle a specific box (sub-cell 1–9) within the selected cell
  const boxNumMatch = n.match(/\b(?:check|uncheck|toggle|mark|clear)\s+box\s+(?:number\s+)?([1-9])\b/);
  if (boxNumMatch) {
    const actionWord = boxNumMatch[0].split(/\s+/)[0];
    const subIndex = parseInt(boxNumMatch[1], 10) - 1;
    const action: 'toggle' | 'turnOn' | 'turnOff' =
      /^(?:uncheck|clear)$/.test(actionWord) ? 'turnOff'
      : /^(?:check|mark)$/.test(actionWord) ? 'turnOn'
      : 'toggle';
    return { type: 'applyToSub', subIndex, action };
  }

  // Toggle all sub-cells in current cell: user must say "toggle all"
  if (/\btoggle\s+all\b/.test(n)) return { type: 'toggle' };
  // Turn on / turn off / mark / clear
  if (/\b(?:turn\s+on|mark|enable|set\s+on|check)\b/.test(n)) return { type: 'turnOn' };
  if (/\b(?:turn\s+off|clear|unmark|disable|set\s+off|uncheck)\b/.test(n)) return { type: 'turnOff' };

  return null;
}
