'use client';

export default function Footer() {
  return (
    <footer style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      padding: '1.5rem 2rem',
      color: 'var(--sub-color)',
      fontSize: '0.7rem',
      fontFamily: "'Roboto Mono', monospace",
    }}>
      {/* Keyboard shortcuts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <kbd style={{ padding: '1px 6px', borderRadius: '4px', backgroundColor: 'var(--sub-alt-color)', fontSize: '0.65rem' }}>tab</kbd>
        <span>+</span>
        <kbd style={{ padding: '1px 6px', borderRadius: '4px', backgroundColor: 'var(--sub-alt-color)', fontSize: '0.65rem' }}>enter</kbd>
        <span>- restart test</span>
      </div>
    </footer>
  );
}
