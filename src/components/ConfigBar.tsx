'use client';

interface ConfigBarProps {
  mode: 'time' | 'words' | 'quote' | 'zen';
  time: number;
  words: number;
  quoteLength: 'short' | 'medium' | 'long' | 'all';
  punctuation: boolean;
  numbers: boolean;
  onModeChange: (mode: 'time' | 'words' | 'quote' | 'zen') => void;
  onTimeChange: (time: number) => void;
  onWordsChange: (words: number) => void;
  onQuoteLengthChange: (length: 'short' | 'medium' | 'long' | 'all') => void;
  onPunctuationToggle: () => void;
  onNumbersToggle: () => void;
  isTestActive: boolean;
}

// Mode icons matching MonkeyType
const modeIcons: Record<string, string> = {
  time: '⏱',
  words: 'A',
  quote: '❝',
  zen: '🏔',
};

function Btn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        color: active ? 'var(--main-color)' : 'var(--sub-color)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        padding: '4px 8px',
        borderRadius: '4px',
        transition: 'color 0.15s',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-color)'; }}
      onMouseLeave={e => { e.currentTarget.style.color = active ? 'var(--main-color)' : 'var(--sub-color)'; }}
    >
      {children}
    </button>
  );
}

function Sep() {
  return (
    <div style={{
      width: '2px',
      alignSelf: 'stretch',
      margin: '6px 6px',
      backgroundColor: 'var(--sub-color)',
      opacity: 0.15,
      borderRadius: '1px',
    }} />
  );
}

export default function ConfigBar({
  mode, time, words, quoteLength, punctuation, numbers,
  onModeChange, onTimeChange, onWordsChange, onQuoteLengthChange,
  onPunctuationToggle, onNumbersToggle, isTestActive,
}: ConfigBarProps) {
  const showToggles = mode === 'time' || mode === 'words';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        transition: 'opacity 0.25s, transform 0.25s',
        opacity: isTestActive ? 0 : 1,
        pointerEvents: isTestActive ? 'none' : 'auto',
        transform: isTestActive ? 'translateY(-10px)' : 'translateY(0)',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: 'var(--sub-alt-color)',
          borderRadius: '10px',
          padding: '4px 12px',
          fontSize: '0.8rem',
          fontFamily: "'Roboto Mono', monospace",
          gap: '2px',
        }}
      >
        {showToggles && (
          <>
            <Btn active={punctuation} onClick={onPunctuationToggle}>
              <span style={{ fontSize: '0.85em' }}>@</span> punctuation
            </Btn>
            <Btn active={numbers} onClick={onNumbersToggle}>
              <span style={{ fontSize: '0.85em' }}>#</span> numbers
            </Btn>
            <Sep />
          </>
        )}

        {(['time', 'words', 'quote', 'zen'] as const).map(m => (
          <Btn key={m} active={mode === m} onClick={() => onModeChange(m)}>
            <span style={{ fontSize: '0.75em' }}>{modeIcons[m]}</span> {m}
          </Btn>
        ))}

        {mode !== 'zen' && (
          <>
            <Sep />
            {mode === 'time' && ([15, 30, 60, 120] as const).map(t => (
              <Btn key={t} active={time === t} onClick={() => onTimeChange(t)}>{t}</Btn>
            ))}
            {mode === 'words' && ([10, 25, 50, 100] as const).map(w => (
              <Btn key={w} active={words === w} onClick={() => onWordsChange(w)}>{w}</Btn>
            ))}
            {mode === 'quote' && (['short', 'medium', 'long', 'all'] as const).map(q => (
              <Btn key={q} active={quoteLength === q} onClick={() => onQuoteLengthChange(q)}>{q}</Btn>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
