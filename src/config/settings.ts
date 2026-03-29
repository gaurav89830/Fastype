export interface Settings {
  // Test settings
  mode: 'time' | 'words' | 'quote' | 'zen';
  time: number;
  words: number;
  quoteLength: 'short' | 'medium' | 'long' | 'all';
  punctuation: boolean;
  numbers: boolean;

  // Visual settings
  theme: string;
  fontSize: number;
  caretStyle: 'line' | 'block' | 'underline' | 'outline';
  smoothCaret: 'off' | 'slow' | 'medium' | 'fast';
  smoothLineScroll: boolean;
  showAllLines: boolean;

  // Behavior settings
  stopOnError: 'off' | 'letter' | 'word';
  soundOnClick: boolean;
  soundOnError: boolean;
  soundVolume: number;
  capsLockWarning: boolean;
  quickRestart: 'tab' | 'esc' | 'off';

  // Live stats
  showLiveWpm: boolean;
  showLiveAcc: boolean;
  showLiveTimer: boolean;

  // Keymap
  showKeymap: boolean;
  keymapStyle: 'static' | 'react' | 'off';
}

export const defaultSettings: Settings = {
  mode: 'time',
  time: 30,
  words: 50,
  quoteLength: 'all',
  punctuation: false,
  numbers: false,
  theme: 'serika_dark',
  fontSize: 1.25,
  caretStyle: 'line',
  smoothCaret: 'medium',
  smoothLineScroll: false,
  showAllLines: false,
  stopOnError: 'off',
  soundOnClick: false,
  soundOnError: true,
  soundVolume: 0.5,
  capsLockWarning: true,
  quickRestart: 'tab',
  showLiveWpm: true,
  showLiveAcc: true,
  showLiveTimer: true,
  showKeymap: false,
  keymapStyle: 'off',
};

export const timeOptions = [15, 30, 60, 120];
export const wordOptions = [10, 25, 50, 100];
export const fontSizeOptions = [1, 1.25, 1.5, 2];
export const quoteLengthOptions = ['short', 'medium', 'long', 'all'] as const;
