/**
 * App: single-page voice-driven data entry.
 * Connects useVoiceCommands → parseVoiceCommand → useGridState for hands-free UX.
 * Shows live transcript, last command, and non-blocking error feedback.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Grid } from './Grid';
import { Results } from './Results';
import { useGridState } from './useGridState';
import { useVoiceCommands } from './useVoiceCommands';
import type { VoiceCommand } from './types';
import { MAIN_COUNT } from './types';
import './App.css';

type View = 'grid' | 'results';

function App() {
  const [view, setView] = useState<View>('grid');
  const [unrecognizedMessage, setUnrecognizedMessage] = useState<string | null>(null);
  const [cellNotFoundMessage, setCellNotFoundMessage] = useState<string | null>(null);
  const unrecognizedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cellNotFoundTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gridState = useGridState();
  const {
    grid,
    focus,
    lastCommandFlash,
    setActiveCell,
    setFocusedSub,
    setSelectedSubIndices,
    toggleSub,
    triggerCommandFlash,
    applyVoiceCommand,
  } = gridState;

  const handleVoiceCommand = useCallback(
    (cmd: VoiceCommand, transcript: string) => {
      if (!cmd) {
        if (transcript.trim()) {
          if (unrecognizedTimeoutRef.current) clearTimeout(unrecognizedTimeoutRef.current);
          setUnrecognizedMessage('Command not understood. Try "next cell", "select center", "toggle".');
          unrecognizedTimeoutRef.current = setTimeout(() => {
            setUnrecognizedMessage(null);
            unrecognizedTimeoutRef.current = null;
          }, 2500);
        }
        return;
      }
      const { activeCellIndex, focusedSubIndex } = focus;

      switch (cmd.type) {
        case 'nextCell':
          setActiveCell(activeCellIndex + 1);
          triggerCommandFlash();
          break;
        case 'prevCell':
          setActiveCell(activeCellIndex - 1);
          triggerCommandFlash();
          break;
        case 'goToCell':
          setActiveCell(cmd.index);
          triggerCommandFlash();
          break;
        case 'cellNotFound':
          if (cellNotFoundTimeoutRef.current) clearTimeout(cellNotFoundTimeoutRef.current);
          setCellNotFoundMessage(`Cell ${cmd.requested} not found. Cells are 1 to ${MAIN_COUNT}.`);
          cellNotFoundTimeoutRef.current = setTimeout(() => {
            setCellNotFoundMessage(null);
            cellNotFoundTimeoutRef.current = null;
          }, 2500);
          break;
        case 'selectSub':
          setFocusedSub(cmd.index);
          triggerCommandFlash();
          break;
        case 'selectSubCells':
          setSelectedSubIndices(cmd.indices);
          triggerCommandFlash();
          break;
        case 'toggle':
        case 'turnOn':
        case 'turnOff':
          applyVoiceCommand(activeCellIndex, focusedSubIndex, cmd.type);
          break;
        default:
          break;
      }
    },
    [focus, setActiveCell, setFocusedSub, setSelectedSubIndices, triggerCommandFlash, applyVoiceCommand]
  );

  useEffect(() => {
    return () => {
      if (unrecognizedTimeoutRef.current) clearTimeout(unrecognizedTimeoutRef.current);
      if (cellNotFoundTimeoutRef.current) clearTimeout(cellNotFoundTimeoutRef.current);
    };
  }, []);

  // Stable ref so voice hook always has latest handler without re-starting recognition
  const handleCommandRef = useRef(handleVoiceCommand);
  handleCommandRef.current = handleVoiceCommand;
  const onCommand = useCallback((cmd: VoiceCommand, transcript: string) => {
    handleCommandRef.current(cmd, transcript);
  }, []);

  const voice = useVoiceCommands(onCommand);

  if (view === 'results') {
    return (
      <Results
        grid={grid}
        focus={focus}
        onBack={() => setView('grid')}
      />
    );
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Voice Data Grid</h1>
        <p className="app__hint">Say &quot;select cell number 5&quot;, &quot;select sub cell 4, 5 and 6&quot;, &quot;next cell&quot;, &quot;toggle&quot;.</p>
      </header>

      <div className="app__voice">
        {!voice.isSupported ? (
          <p className="app__error" role="alert">
            {voice.error ?? 'Voice input is not supported. Use Chrome or Edge.'}
          </p>
        ) : (
          <>
            <button
              type="button"
              className={`app__voice-btn ${voice.isListening ? 'app__voice-btn--active' : ''}`}
              onClick={voice.isListening ? voice.stop : voice.start}
              aria-pressed={voice.isListening}
              aria-label={voice.isListening ? 'Stop voice input' : 'Start voice input'}
            >
              {voice.isListening ? 'Stop voice' : 'Start voice input'}
            </button>
            {voice.lastRecognized && (
              <p className="app__last-cmd" aria-live="polite">
                Heard: <strong>{voice.lastRecognized}</strong>
              </p>
            )}
            {voice.transcript && voice.transcript !== voice.lastRecognized && (
              <p className="app__transcript" aria-live="off">
                {voice.transcript}
              </p>
            )}
            {voice.error && (
              <p className="app__error" role="alert">
                {voice.error}
              </p>
            )}
            {unrecognizedMessage && (
              <p className="app__unrecognized" role="status">
                {unrecognizedMessage}
              </p>
            )}
            {cellNotFoundMessage && (
              <p className="app__unrecognized" role="alert">
                {cellNotFoundMessage}
              </p>
            )}
          </>
        )}
      </div>

      <main className="app__main">
        <Grid
          grid={grid}
          focus={focus}
          lastCommandFlash={lastCommandFlash}
          setActiveCell={setActiveCell}
          setFocusedSub={setFocusedSub}
          toggleSub={toggleSub}
        />
      </main>

      <footer className="app__footer">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => setView('results')}
        >
          Next step
        </button>
      </footer>
    </div>
  );
}

export default App;
