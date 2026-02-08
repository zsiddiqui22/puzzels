/**
 * useVoiceCommands: Web Speech API wrapper for hands-free input.
 * Continuous recognition with live transcript and parsed command callback.
 * Graceful fallback when API is not available (e.g. Firefox).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { parseVoiceCommand } from './parseVoiceCommand';
import type { VoiceCommand } from './types';

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

export function useVoiceCommands(onCommand: (cmd: VoiceCommand, transcript: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastRecognized, setLastRecognized] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

  const isSupported =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition != null || window.webkitSpeechRecognition != null);

  const start = useCallback(() => {
    if (!isSupported) {
      setError('Voice input is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    setError(null);
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setError('Voice input is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    const recognition = new Recognition() as SpeechRecognitionInstance;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const results = e.results;
      let final = '';
      let interim = '';
      for (let i = e.resultIndex; i < results.length; i++) {
        const item = results[i];
        const text = item[0]?.transcript ?? '';
        if (item.isFinal) final += text;
        else interim += text;
      }
      if (final) {
        setLastRecognized(final);
        setTranscript((t) => t + final + ' ');
        const cmd = parseVoiceCommand(final);
        if (cmd) {
          onCommandRef.current(cmd, final);
        } else {
          onCommandRef.current(null, final);
        }
      }
      if (interim) setTranscript((t) => t + interim);
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      setError(e.message ?? e.error);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
      setTranscript('');
      setLastRecognized('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start voice input');
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
        recognitionRef.current = null;
      }
    };
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setLastRecognized('');
    setError(null);
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    lastRecognized,
    error,
    start,
    stop,
    clearTranscript,
  };
}
