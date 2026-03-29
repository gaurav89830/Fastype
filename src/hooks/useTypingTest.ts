'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { TypingState, TestResult } from '@/types';

interface UseTypingTestOptions {
  mode: 'time' | 'words' | 'quote' | 'zen';
  time: number;
  words: string[];
  soundOnError: boolean;
  soundVolume: number;
  stopOnError: 'off' | 'letter' | 'word';
  onFinish?: (result: TestResult) => void;
}

function computeConsistency(wpmHistory: number[]): number {
  const filtered = wpmHistory.filter((v) => v > 0);
  if (filtered.length < 2) return 100;
  const mean = filtered.reduce((a, b) => a + b, 0) / filtered.length;
  if (mean === 0) return 0;
  const variance =
    filtered.reduce((sum, v) => sum + (v - mean) ** 2, 0) / filtered.length;
  const stddev = Math.sqrt(variance);
  const consistency = 100 - (stddev / mean) * 100;
  return Math.max(0, Math.min(100, consistency));
}

export function useTypingTest(options: UseTypingTestOptions) {
  const { mode, time, words: initialWords, soundOnError, soundVolume, stopOnError, onFinish } = options;

  // ---------------------------------------------------------------------------
  // State (drives UI)
  // ---------------------------------------------------------------------------
  const [words, setWords] = useState<string[]>(initialWords);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [input, setInput] = useState('');
  const [wordInputs, setWordInputs] = useState<string[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(time);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveRawWpm, setLiveRawWpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);
  const [wpmHistory, setWpmHistory] = useState<number[]>([]);
  const [rawWpmHistory, setRawWpmHistory] = useState<number[]>([]);
  const [errorHistory, setErrorHistory] = useState<number[]>([]);
  const [result, setResult] = useState<TestResult | null>(null);

  // ---------------------------------------------------------------------------
  // Refs (mutable state that should NOT trigger rerenders)
  // ---------------------------------------------------------------------------
  const inputRef = useRef<HTMLInputElement>(null!);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const correctCharsRef = useRef(0);
  const incorrectCharsRef = useRef(0);
  const extraCharsRef = useRef(0);
  const totalTypedCharsRef = useRef(0);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);
  const doneAudioRef = useRef<HTMLAudioElement | null>(null);
  const isFinishedRef = useRef(false);
  // snapshot refs so the timer callback always reads the latest values
  const currentWordIndexRef = useRef(0);
  const wordInputsRef = useRef<string[]>([]);
  const wordsRef = useRef<string[]>(initialWords);

  // Keep refs in sync with state
  useEffect(() => { currentWordIndexRef.current = currentWordIndex; }, [currentWordIndex]);
  useEffect(() => { wordInputsRef.current = wordInputs; }, [wordInputs]);
  useEffect(() => { wordsRef.current = words; }, [words]);

  // ---------------------------------------------------------------------------
  // Audio setup
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (typeof window !== 'undefined') {
      errorAudioRef.current = new Audio('/Mistake.mp3');
      doneAudioRef.current = new Audio('/TestDone.mp3');
    }
    return () => {
      errorAudioRef.current = null;
      doneAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (errorAudioRef.current) errorAudioRef.current.volume = soundVolume;
    if (doneAudioRef.current) doneAudioRef.current.volume = soundVolume;
  }, [soundVolume]);

  // ---------------------------------------------------------------------------
  // Play helpers
  // ---------------------------------------------------------------------------
  const playErrorSound = useCallback(() => {
    if (!soundOnError || !errorAudioRef.current) return;
    errorAudioRef.current.currentTime = 0;
    errorAudioRef.current.play().catch(() => {});
  }, [soundOnError]);

  const playDoneSound = useCallback(() => {
    if (!doneAudioRef.current) return;
    doneAudioRef.current.currentTime = 0;
    doneAudioRef.current.play().catch(() => {});
  }, []);

  // ---------------------------------------------------------------------------
  // Live stats update
  // ---------------------------------------------------------------------------
  const updateLiveStats = useCallback(() => {
    const start = startTimeRef.current;
    if (!start) return;
    const elapsed = (Date.now() - start) / 1000;
    if (elapsed <= 0) return;

    const elapsedMin = elapsed / 60;
    const correct = correctCharsRef.current;
    const total = totalTypedCharsRef.current;

    const wpm = Math.round((correct / 5) / elapsedMin) || 0;
    const rawWpm = Math.round((total / 5) / elapsedMin) || 0;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 100;

    setLiveWpm(wpm);
    setLiveRawWpm(rawWpm);
    setLiveAccuracy(accuracy);
  }, []);

  // ---------------------------------------------------------------------------
  // Finish test
  // ---------------------------------------------------------------------------
  const finishTest = useCallback(() => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    setIsFinished(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const start = startTimeRef.current;
    const totalElapsed = start ? (Date.now() - start) / 1000 : 0;
    const elapsedMin = totalElapsed / 60 || 1 / 60; // avoid div-by-zero

    const correct = correctCharsRef.current;
    const incorrect = incorrectCharsRef.current;
    const extra = extraCharsRef.current;
    const total = totalTypedCharsRef.current;

    // Calculate missed chars: characters in completed words that weren't typed
    let missed = 0;
    const wi = wordInputsRef.current;
    const ws = wordsRef.current;
    for (let i = 0; i < wi.length; i++) {
      if (ws[i] && wi[i].length < ws[i].length) {
        missed += ws[i].length - wi[i].length;
      }
    }

    const finalWpm = Math.round((correct / 5) / elapsedMin) || 0;
    const finalRawWpm = Math.round((total / 5) / elapsedMin) || 0;
    const finalAccuracy = total > 0 ? Math.round((correct / total) * 100) : 100;

    // Read history from state via a final snapshot; we build the result here.
    // We'll use a setState callback to capture the latest histories.
    setWpmHistory((prevWpm) => {
      setRawWpmHistory((prevRaw) => {
        setErrorHistory((prevErr) => {
          const testResult: TestResult = {
            wpm: finalWpm,
            rawWpm: finalRawWpm,
            accuracy: finalAccuracy,
            consistency: computeConsistency(prevWpm),
            correctChars: correct,
            incorrectChars: incorrect,
            extraChars: extra,
            missedChars: missed,
            totalChars: total,
            time: Math.round(totalElapsed * 10) / 10,
            mode,
            modeOption: mode === 'time' ? time : ws.length,
            wpmHistory: prevWpm,
            rawWpmHistory: prevRaw,
            errorHistory: prevErr,
          };
          setResult(testResult);
          onFinish?.(testResult);
          return prevErr;
        });
        return prevRaw;
      });
      return prevWpm;
    });

    playDoneSound();
  }, [mode, time, onFinish, playDoneSound]);

  // ---------------------------------------------------------------------------
  // Timer
  // ---------------------------------------------------------------------------
  const startTimer = useCallback(() => {
    if (timerRef.current) return;

    timerRef.current = setInterval(() => {
      if (isFinishedRef.current) {
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      const start = startTimeRef.current;
      if (!start) return;
      const elapsed = (Date.now() - start) / 1000;
      const elapsedSec = Math.floor(elapsed);
      const elapsedMin = elapsed / 60;

      setElapsedTime(elapsedSec);

      if (mode === 'time') {
        const remaining = Math.max(0, time - elapsedSec);
        setTimeLeft(remaining);
        if (remaining <= 0) {
          finishTest();
          return;
        }
      }

      // Record per-second stats
      const correct = correctCharsRef.current;
      const total = totalTypedCharsRef.current;
      const incorrect = incorrectCharsRef.current;

      const wpm = elapsedMin > 0 ? Math.round((correct / 5) / elapsedMin) : 0;
      const rawWpm = elapsedMin > 0 ? Math.round((total / 5) / elapsedMin) : 0;

      setWpmHistory((prev) => {
        // Only add a new entry if this is a new second
        if (prev.length < elapsedSec) {
          return [...prev, wpm];
        }
        return prev;
      });
      setRawWpmHistory((prev) => {
        if (prev.length < elapsedSec) {
          return [...prev, rawWpm];
        }
        return prev;
      });
      setErrorHistory((prev) => {
        if (prev.length < elapsedSec) {
          return [...prev, incorrect];
        }
        return prev;
      });
    }, 200); // poll every 200ms for responsive updates
  }, [mode, time, finishTest]);

  // ---------------------------------------------------------------------------
  // Cleanup on unmount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // handleInput
  // ---------------------------------------------------------------------------
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isFinishedRef.current) return;

      const value = e.target.value;
      const currentWord = wordsRef.current[currentWordIndexRef.current];
      if (!currentWord && mode !== 'zen') return;

      // Start the test on first input
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
        setIsStarted(true);
        startTimer();
      }

      // Detect if the user typed a space at the end  -> advance word
      if (value.endsWith(' ')) {
        const typed = value.slice(0, -1);

        // stopOnError === 'word': don't advance if the typed word doesn't match
        if (stopOnError === 'word' && typed !== currentWord) {
          // Don't advance, keep input as-is (without the space)
          setInput(typed);
          return;
        }

        // Count chars for the completed word
        const wordLen = currentWord ? currentWord.length : 0;
        for (let i = 0; i < Math.max(typed.length, wordLen); i++) {
          if (i < typed.length && i < wordLen) {
            if (typed[i] === currentWord[i]) {
              correctCharsRef.current++;
            } else {
              incorrectCharsRef.current++;
            }
            totalTypedCharsRef.current++;
          } else if (i >= wordLen) {
            // extra chars
            extraCharsRef.current++;
            incorrectCharsRef.current++;
            totalTypedCharsRef.current++;
          }
          // i >= typed.length && i < wordLen => missed chars (counted at finish)
        }

        // Store what was typed for this word
        setWordInputs((prev) => {
          const next = [...prev];
          next[currentWordIndexRef.current] = typed;
          return next;
        });

        // Move to next word
        const nextIndex = currentWordIndexRef.current + 1;
        setCurrentWordIndex(nextIndex);
        setCurrentCharIndex(0);
        setInput('');

        updateLiveStats();

        // Check if we've finished all words (words/quote mode)
        if ((mode === 'words' || mode === 'quote') && nextIndex >= wordsRef.current.length) {
          finishTest();
        }

        return;
      }

      // Normal character typing (no space at end)
      // stopOnError === 'letter': prevent typing further if last char is wrong
      if (stopOnError === 'letter' && currentWord && value.length > 0) {
        const lastIdx = value.length - 1;
        if (lastIdx < currentWord.length && value[lastIdx] !== currentWord[lastIdx]) {
          playErrorSound();
          // Don't accept this character
          setInput(value.slice(0, -1));
          return;
        }
        if (lastIdx >= currentWord.length) {
          // Extra char in letter mode: block it
          playErrorSound();
          setInput(value.slice(0, -1));
          return;
        }
      }

      // Detect errors for sound
      if (value.length > input.length && currentWord) {
        const charIdx = value.length - 1;
        if (charIdx < currentWord.length) {
          if (value[charIdx] !== currentWord[charIdx]) {
            playErrorSound();
          }
        } else {
          // Extra character
          playErrorSound();
        }
      }

      setInput(value);
      setCurrentCharIndex(value.length);
    },
    [input, mode, stopOnError, startTimer, finishTest, updateLiveStats, playErrorSound],
  );

  // ---------------------------------------------------------------------------
  // handleKeyDown  (ctrl+backspace, tab to restart, etc.)
  // ---------------------------------------------------------------------------
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isFinishedRef.current) return;

      // Ctrl+Backspace or Cmd+Backspace -> delete whole word (clear input)
      if (e.key === 'Backspace' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setInput('');
        setCurrentCharIndex(0);
        return;
      }

      // Prevent default tab behaviour inside the input
      if (e.key === 'Tab') {
        e.preventDefault();
      }
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // restart
  // ---------------------------------------------------------------------------
  const restart = useCallback(
    (newWords: string[]) => {
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Reset refs
      startTimeRef.current = null;
      correctCharsRef.current = 0;
      incorrectCharsRef.current = 0;
      extraCharsRef.current = 0;
      totalTypedCharsRef.current = 0;
      isFinishedRef.current = false;
      currentWordIndexRef.current = 0;
      wordInputsRef.current = [];
      wordsRef.current = newWords;

      // Reset state
      setWords(newWords);
      setCurrentWordIndex(0);
      setCurrentCharIndex(0);
      setInput('');
      setWordInputs([]);
      setIsStarted(false);
      setIsFinished(false);
      setTimeLeft(time);
      setElapsedTime(0);
      setLiveWpm(0);
      setLiveRawWpm(0);
      setLiveAccuracy(100);
      setWpmHistory([]);
      setRawWpmHistory([]);
      setErrorHistory([]);
      setResult(null);

      // Refocus input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    },
    [time],
  );

  // ---------------------------------------------------------------------------
  // Keep input focused while test is active
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isFinished) return;

    const handleClick = () => {
      inputRef.current?.focus();
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isFinished]);

  // Focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    // State
    words,
    currentWordIndex,
    currentCharIndex,
    input,
    wordInputs,
    isStarted,
    isFinished,
    timeLeft,
    elapsedTime,
    liveWpm,
    liveRawWpm,
    liveAccuracy,
    wpmHistory,
    rawWpmHistory,
    errorHistory,

    // Actions
    handleInput,
    handleKeyDown,
    restart,

    // Result
    result,

    // Refs
    inputRef,
  };
}
