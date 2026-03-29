'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import ConfigBar from '@/components/ConfigBar';
import TypingArea from '@/components/TypingArea';
import LiveStats from '@/components/LiveStats';
import ResultScreen from '@/components/ResultScreen';
import Footer from '@/components/Footer';
import { useSettings } from '@/hooks/useSettings';
import { useTypingTest } from '@/hooks/useTypingTest';
import { generateWords, getRandomSentence, getQuote } from '@/config/words';

function makeWords(
  mode: 'time' | 'words' | 'quote' | 'zen',
  wordCount: number,
  quoteLength: 'short' | 'medium' | 'long' | 'all',
  punctuation: boolean,
  numbers: boolean,
): string[] {
  switch (mode) {
    case 'time': return generateWords(200, { punctuation, numbers });
    case 'words': return generateWords(wordCount, { punctuation, numbers });
    case 'quote': return (quoteLength === 'all' ? getRandomSentence() : getQuote(quoteLength)).split(' ');
    case 'zen': return generateWords(200, { punctuation, numbers });
    default: return generateWords(200, { punctuation, numbers });
  }
}

export default function Home() {
  const { settings, updateSetting } = useSettings();
  const [mounted, setMounted] = useState(false);
  const wordsRef = useRef<string[]>([]);
  const [initialWords, setInitialWords] = useState<string[]>([]);
  const [inputFocused, setInputFocused] = useState(false);

  // Only generate words on client side (avoids hydration mismatch from Math.random)
  useEffect(() => {
    if (!mounted) {
      const w = makeWords(settings.mode, settings.words, settings.quoteLength, settings.punctuation, settings.numbers);
      wordsRef.current = w;
      setInitialWords(w);
      setMounted(true);
    }
  }, [mounted, settings]);

  const getNewWords = useCallback(() => {
    const w = makeWords(settings.mode, settings.words, settings.quoteLength, settings.punctuation, settings.numbers);
    wordsRef.current = w;
    return w;
  }, [settings.mode, settings.words, settings.quoteLength, settings.punctuation, settings.numbers]);

  const {
    words, currentWordIndex, currentCharIndex, input, wordInputs,
    isStarted, isFinished, timeLeft, elapsedTime, liveWpm, liveAccuracy,
    handleInput, handleKeyDown, restart, result, inputRef,
  } = useTypingTest({
    mode: settings.mode,
    time: settings.time,
    words: initialWords,
    soundOnError: settings.soundOnError,
    soundVolume: settings.soundVolume,
    stopOnError: settings.stopOnError,
  });

  // Caps Lock
  const [capsLock, setCapsLock] = useState(false);
  useEffect(() => {
    const h = (e: KeyboardEvent) => setCapsLock(e.getModifierState('CapsLock'));
    window.addEventListener('keydown', h);
    window.addEventListener('keyup', h);
    return () => { window.removeEventListener('keydown', h); window.removeEventListener('keyup', h); };
  }, []);

  const handleRestart = useCallback(() => { restart(getNewWords()); }, [getNewWords, restart]);
  const handleRepeat = useCallback(() => { restart([...wordsRef.current]); }, [restart]);

  // Tab+Enter to restart, Esc to restart
  useEffect(() => {
    let tabDown = false;
    const kd = (e: KeyboardEvent) => {
      if (e.key === 'Tab') { tabDown = true; e.preventDefault(); }
      if (e.key === 'Enter' && tabDown) { e.preventDefault(); handleRestart(); }
      if (e.key === 'Escape' && settings.quickRestart === 'esc') { e.preventDefault(); handleRestart(); }
    };
    const ku = (e: KeyboardEvent) => { if (e.key === 'Tab') tabDown = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, [handleRestart, settings.quickRestart]);

  // Restart on settings change
  const prevKey = useRef('');
  useEffect(() => {
    const key = `${settings.mode}-${settings.time}-${settings.words}-${settings.punctuation}-${settings.numbers}-${settings.quoteLength}`;
    if (prevKey.current && prevKey.current !== key) handleRestart();
    prevKey.current = key;
  }, [settings.mode, settings.time, settings.words, settings.punctuation, settings.numbers, settings.quoteLength, handleRestart]);

  const handleFocusInput = useCallback(() => { inputRef.current?.focus(); }, [inputRef]);
  const isTestActive = isStarted && !isFinished;

  // Loading state (SSR -> client transition)
  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)' }}>
        <Header onSettingsClick={() => {}} />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'var(--sub-color)', fontFamily: 'var(--font-family)' }}>Loading...</span>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)' }}>
      <Header onSettingsClick={() => {}} />

      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '850px',
        margin: '0 auto',
        padding: '0 2rem',
      }}>
        {/* Config bar */}
        <div style={{ width: '100%', marginBottom: '2rem' }}>
          <ConfigBar
            mode={settings.mode} time={settings.time} words={settings.words}
            quoteLength={settings.quoteLength} punctuation={settings.punctuation} numbers={settings.numbers}
            onModeChange={m => updateSetting('mode', m)}
            onTimeChange={t => updateSetting('time', t)}
            onWordsChange={w => updateSetting('words', w)}
            onQuoteLengthChange={q => updateSetting('quoteLength', q)}
            onPunctuationToggle={() => updateSetting('punctuation', !settings.punctuation)}
            onNumbersToggle={() => updateSetting('numbers', !settings.numbers)}
            isTestActive={isTestActive}
          />
        </div>

        {/* Caps Lock */}
        {capsLock && settings.capsLockWarning && (
          <div style={{
            color: 'var(--error-color)', fontSize: '0.8rem', display: 'flex',
            alignItems: 'center', gap: '6px', justifyContent: 'center', padding: '4px 0',
          }}>
            ⚠ Caps Lock is on
          </div>
        )}

        {/* Language label (like MonkeyType's "english") */}
        {!isTestActive && !isFinished && (
          <div style={{
            color: 'var(--sub-color)', fontSize: '0.8rem', marginBottom: '0.75rem',
            display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'opacity 0.2s',
          }}>
            <span style={{ fontSize: '0.7rem' }}>🌐</span> english
          </div>
        )}

        {!isFinished ? (
          <>
            {/* Live stats (timer / wpm / acc) */}
            <LiveStats
              wpm={liveWpm} accuracy={liveAccuracy} timeLeft={timeLeft}
              elapsedTime={elapsedTime} mode={settings.mode} isStarted={isStarted}
              isFinished={isFinished} showWpm={settings.showLiveWpm}
              showAcc={settings.showLiveAcc} showTimer={settings.showLiveTimer}
            />

            {/* Typing area */}
            <div style={{ width: '100%', position: 'relative' }}>
              <TypingArea
                words={words} currentWordIndex={currentWordIndex} currentCharIndex={currentCharIndex}
                wordInputs={wordInputs} input={input} isStarted={isStarted} isFinished={isFinished}
                caretStyle={settings.caretStyle} smoothCaret={settings.smoothCaret}
                showAllLines={settings.showAllLines} fontSize={settings.fontSize}
                isFocused={inputFocused} onFocus={handleFocusInput}
              />

              {/* Hidden input */}
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                style={{ position: 'absolute', left: '-9999px', opacity: 0, width: 0, height: 0 }}
                aria-label="Type here"
              />
            </div>

            {/* Restart button (circular, like MonkeyType) */}
            <button
              onClick={handleRestart}
              title="Restart test"
              style={{
                marginTop: '1.5rem',
                background: 'none',
                border: 'none',
                color: 'var(--sub-color)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                transition: 'color 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-color)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--sub-color)'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          </>
        ) : result ? (
          <ResultScreen result={result} onRestart={handleRestart} onRepeat={handleRepeat} />
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
