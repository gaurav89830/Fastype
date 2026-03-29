'use client';

import React, { useRef, useEffect, useMemo, useCallback } from 'react';

interface TypingAreaProps {
  words: string[];
  currentWordIndex: number;
  currentCharIndex: number;
  wordInputs: string[];
  input: string;
  isStarted: boolean;
  isFinished: boolean;
  caretStyle: 'line' | 'block' | 'underline' | 'outline';
  smoothCaret: 'off' | 'slow' | 'medium' | 'fast';
  showAllLines: boolean;
  fontSize: number;
  isFocused: boolean;
  onFocus: () => void;
}

interface CharState {
  char: string;
  status: 'correct' | 'incorrect' | 'untyped';
  isExtra: boolean;
}

interface WordState {
  chars: CharState[];
  isActive: boolean;
  isCompleted: boolean;
  hasError: boolean;
}

const SMOOTH_DURATIONS: Record<string, number> = {
  off: 0,
  slow: 150,
  medium: 100,
  fast: 50,
};

function computeWordStates(
  words: string[],
  currentWordIndex: number,
  currentCharIndex: number,
  wordInputs: string[],
  input: string,
): WordState[] {
  return words.map((word, wordIdx) => {
    const chars: CharState[] = [];
    let hasError = false;

    if (wordIdx < currentWordIndex) {
      const typed = wordInputs[wordIdx] ?? '';
      for (let i = 0; i < word.length; i++) {
        const isCorrect = i < typed.length && typed[i] === word[i];
        const isTyped = i < typed.length;
        if (isTyped && !isCorrect) hasError = true;
        chars.push({
          char: word[i],
          status: !isTyped ? 'untyped' : isCorrect ? 'correct' : 'incorrect',
          isExtra: false,
        });
      }
      for (let i = word.length; i < typed.length; i++) {
        hasError = true;
        chars.push({ char: typed[i], status: 'incorrect', isExtra: true });
      }
      if (typed.length < word.length) hasError = true;
    } else if (wordIdx === currentWordIndex) {
      for (let i = 0; i < word.length; i++) {
        if (i < currentCharIndex) {
          const isCorrect = i < input.length && input[i] === word[i];
          if (!isCorrect) hasError = true;
          chars.push({
            char: word[i],
            status: isCorrect ? 'correct' : 'incorrect',
            isExtra: false,
          });
        } else {
          chars.push({ char: word[i], status: 'untyped', isExtra: false });
        }
      }
      for (let i = word.length; i < input.length; i++) {
        hasError = true;
        chars.push({ char: input[i], status: 'incorrect', isExtra: true });
      }
    } else {
      for (let i = 0; i < word.length; i++) {
        chars.push({ char: word[i], status: 'untyped', isExtra: false });
      }
    }

    return {
      chars,
      isActive: wordIdx === currentWordIndex,
      isCompleted: wordIdx < currentWordIndex,
      hasError,
    };
  });
}

const TypingArea = React.memo(function TypingArea({
  words,
  currentWordIndex,
  currentCharIndex,
  wordInputs,
  input,
  isStarted,
  isFinished,
  caretStyle,
  smoothCaret,
  showAllLines,
  fontSize,
  isFocused,
  onFocus,
}: TypingAreaProps) {
  const wordsContainerRef = useRef<HTMLDivElement>(null);
  const activeCharRef = useRef<HTMLSpanElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);

  const wordStates = useMemo(
    () => computeWordStates(words, currentWordIndex, currentCharIndex, wordInputs, input),
    [words, currentWordIndex, currentCharIndex, wordInputs, input],
  );

  // Position caret
  useEffect(() => {
    const caret = caretRef.current;
    const container = wordsContainerRef.current;
    if (!caret || !container) return;

    const activeChar = activeCharRef.current;
    if (!activeChar) {
      caret.style.opacity = '0';
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const charRect = activeChar.getBoundingClientRect();

    const top = charRect.top - containerRect.top + container.scrollTop;
    const left = charRect.left - containerRect.left + container.scrollLeft;
    const charWidth = charRect.width;
    const charHeight = charRect.height;

    caret.style.opacity = '1';

    switch (caretStyle) {
      case 'line':
        caret.style.left = `${left}px`;
        caret.style.top = `${top}px`;
        caret.style.width = '2.5px';
        caret.style.height = `${charHeight}px`;
        caret.style.background = 'var(--caret-color)';
        caret.style.border = 'none';
        caret.style.borderRadius = '1px';
        break;
      case 'block':
        caret.style.left = `${left}px`;
        caret.style.top = `${top}px`;
        caret.style.width = `${charWidth}px`;
        caret.style.height = `${charHeight}px`;
        caret.style.background = 'var(--caret-color)';
        caret.style.opacity = '0.3';
        caret.style.border = 'none';
        break;
      case 'underline':
        caret.style.left = `${left}px`;
        caret.style.top = `${top + charHeight - 3}px`;
        caret.style.width = `${charWidth}px`;
        caret.style.height = '3px';
        caret.style.background = 'var(--caret-color)';
        caret.style.border = 'none';
        break;
      case 'outline':
        caret.style.left = `${left}px`;
        caret.style.top = `${top}px`;
        caret.style.width = `${charWidth}px`;
        caret.style.height = `${charHeight}px`;
        caret.style.background = 'transparent';
        caret.style.border = '2px solid var(--caret-color)';
        caret.style.borderRadius = '2px';
        break;
    }
  }, [currentWordIndex, currentCharIndex, input, caretStyle, words, wordStates]);

  // Scroll active word into view
  useEffect(() => {
    if (showAllLines) return;
    const container = wordsContainerRef.current;
    const activeChar = activeCharRef.current;
    if (!container || !activeChar) return;

    const containerRect = container.getBoundingClientRect();
    const charRect = activeChar.getBoundingClientRect();
    const lineHeight = charRect.height + 10;
    const relativeTop = charRect.top - containerRect.top + container.scrollTop;
    const currentLine = Math.floor(relativeTop / lineHeight);

    if (currentLine >= 2) {
      container.scrollTo({ top: (currentLine - 1) * lineHeight, behavior: 'smooth' });
    }
  }, [currentWordIndex, currentCharIndex, showAllLines]);

  const handleClick = useCallback(() => { onFocus(); }, [onFocus]);

  const smoothTransition = useMemo(() => {
    const d = SMOOTH_DURATIONS[smoothCaret] ?? 0;
    return d === 0 ? 'none' : `left ${d}ms ease-out, top ${d}ms ease-out`;
  }, [smoothCaret]);

  const shouldBlink = !isStarted && !isFinished;

  // Font: MonkeyType uses ~1.5rem for standard, we scale from there
  const fontPx = `${fontSize * 1.25}rem`;
  const lineH = 1.65;

  // 3 lines visible
  const containerHeight = showAllLines ? 'none' : `calc(${fontPx} * ${lineH} * 3)`;

  if (words.length === 0) {
    return (
      <div style={{ minHeight: '120px', color: 'var(--sub-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading...
      </div>
    );
  }

  return (
    <div
      className="relative select-none"
      style={{
        fontFamily: "'Roboto Mono', 'SF Mono', 'Fira Code', 'Consolas', monospace",
        fontSize: fontPx,
        lineHeight: lineH,
      }}
      onClick={handleClick}
      role="button"
      tabIndex={-1}
    >
      {/* Focus overlay - blurs words when not focused */}
      {!isFocused && !isFinished && (
        <div
          className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center rounded-lg"
          style={{
            background: 'var(--bg-color)',
            opacity: 0.7,
            backdropFilter: 'blur(4px)',
          }}
        >
          <span style={{ color: 'var(--sub-color)', fontSize: '1rem', letterSpacing: '0.02em' }}>
            Click or press any key to focus
          </span>
        </div>
      )}

      {/* Words container */}
      <div
        ref={wordsContainerRef}
        className="relative"
        style={{
          maxHeight: containerHeight,
          overflow: showAllLines ? 'visible' : 'hidden',
        }}
      >
        {/* Caret */}
        <div
          ref={caretRef}
          className="pointer-events-none absolute"
          style={{
            zIndex: 5,
            transition: smoothTransition,
            animation: shouldBlink ? 'caretBlink 1s infinite' : 'none',
            willChange: 'left, top',
          }}
        />

        {/* Words */}
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {wordStates.map((ws, wordIdx) => (
            <div
              key={wordIdx}
              style={{
                display: 'inline-flex',
                margin: '0.25em 0.6em 0.25em 0',
                borderBottom: ws.isCompleted && ws.hasError
                  ? '2px solid var(--error-color)'
                  : '2px solid transparent',
              }}
            >
              {ws.chars.map((cs, charIdx) => {
                const isCaretHere =
                  ws.isActive && charIdx === currentCharIndex && !cs.isExtra;
                const isCaretAtExtra =
                  ws.isActive && cs.isExtra && charIdx === input.length && currentCharIndex >= words[wordIdx].length;
                const shouldRef = isCaretHere || isCaretAtExtra;

                let color: string;
                if (cs.status === 'correct') color = 'var(--text-color)';
                else if (cs.status === 'incorrect') color = cs.isExtra ? 'var(--error-extra-color)' : 'var(--error-color)';
                else color = 'var(--sub-color)';

                return (
                  <span
                    key={`${charIdx}-${cs.isExtra ? 'x' : 'n'}`}
                    ref={shouldRef ? activeCharRef : null}
                    style={{
                      color,
                      opacity: cs.isExtra ? 0.65 : 1,
                      transition: 'color 0.1s',
                    }}
                  >
                    {cs.char}
                  </span>
                );
              })}

              {/* Zero-width sentinel for caret at end of word */}
              {ws.isActive && currentCharIndex >= ws.chars.length && (
                <span
                  ref={activeCharRef}
                  style={{ width: 0, display: 'inline-block', color: 'transparent' }}
                  aria-hidden
                >
                  {'\u200B'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

TypingArea.displayName = 'TypingArea';
export default TypingArea;
