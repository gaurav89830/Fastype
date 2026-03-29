export interface TypingState {
  words: string[];
  currentWordIndex: number;
  currentCharIndex: number;
  input: string;
  wordInputs: string[];
  isStarted: boolean;
  isFinished: boolean;
  startTime: number | null;
  endTime: number | null;
  timeLeft: number;
  elapsedTime: number;
}

export interface CharState {
  char: string;
  state: 'untyped' | 'correct' | 'incorrect' | 'extra';
}

export interface WordState {
  chars: CharState[];
  typed: string;
  isCorrect: boolean;
}

export interface TestResult {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  totalChars: number;
  time: number;
  mode: string;
  modeOption: number | string;
  wpmHistory: number[];
  rawWpmHistory: number[];
  errorHistory: number[];
}

export type TestMode = 'time' | 'words' | 'quote' | 'zen';
export type CaretStyle = 'line' | 'block' | 'underline' | 'outline';
