'use client';

import { useMemo } from 'react';

interface LiveStatsProps {
  wpm: number;
  accuracy: number;
  timeLeft: number;
  elapsedTime: number;
  mode: 'time' | 'words' | 'quote' | 'zen';
  isStarted: boolean;
  isFinished: boolean;
  showWpm: boolean;
  showAcc: boolean;
  showTimer: boolean;
}

function fmt(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s >= 60) {
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
  }
  return `${s}`;
}

export default function LiveStats({
  wpm, accuracy, timeLeft, elapsedTime, mode, isStarted, isFinished, showWpm, showAcc, showTimer,
}: LiveStatsProps) {
  const timeDisplay = useMemo(() => {
    return mode === 'time' ? fmt(timeLeft) : fmt(elapsedTime);
  }, [mode, timeLeft, elapsedTime]);

  if (isFinished) return null;
  if (!showWpm && !showAcc && !showTimer) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'center',
      gap: '2rem',
      padding: '0.25rem 0',
      marginBottom: '0.5rem',
      fontFamily: "'Roboto Mono', monospace",
      minHeight: '2rem',
      transition: 'opacity 0.3s',
    }}>
      {showTimer && (
        <span style={{
          fontSize: '1.75rem',
          fontWeight: 300,
          color: isStarted ? 'var(--main-color)' : 'var(--sub-color)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {isStarted ? timeDisplay : mode === 'time' ? fmt(timeLeft) : '0'}
        </span>
      )}

      {showWpm && isStarted && (
        <span style={{
          fontSize: '1.75rem',
          fontWeight: 300,
          color: 'var(--sub-color)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {Math.round(wpm)}
        </span>
      )}

      {showAcc && isStarted && (
        <span style={{
          fontSize: '1.75rem',
          fontWeight: 300,
          color: 'var(--sub-color)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {Math.round(accuracy)}%
        </span>
      )}
    </div>
  );
}
