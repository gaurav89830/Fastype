'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface ResultScreenProps {
  result: {
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
  };
  onRestart: () => void;
  onRepeat: () => void;
}

/**
 * Animates a number from 0 to the target value over a given duration.
 */
function useCountUp(target: number, duration: number = 800, decimals: number = 0): string {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let frameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * target);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);

  return value.toFixed(decimals);
}

/**
 * Reads a CSS custom property from the document root.
 * Falls back to the provided default if unavailable (e.g., SSR).
 */
function useCSSVar(varName: string, fallback: string): string {
  const [color, setColor] = useState(fallback);

  useEffect(() => {
    const root = document.documentElement;
    const computed = getComputedStyle(root).getPropertyValue(varName).trim();
    if (computed) setColor(computed);
  }, [varName]);

  return color;
}

export default function ResultScreen({ result, onRestart, onRepeat }: ResultScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Theme colors
  const mainColor = useCSSVar('--main-color', '#e2b714');
  const subColor = useCSSVar('--sub-color', '#646669');
  const subAltColor = useCSSVar('--sub-alt-color', '#2c2e31');
  const errorColor = useCSSVar('--error-color', '#ca4754');
  const textColor = useCSSVar('--text-color', '#d1d0c5');
  const bgColor = useCSSVar('--bg-color', '#323437');

  // Animated values
  const animatedWpm = useCountUp(result.wpm, 1000);
  const animatedAccuracy = useCountUp(result.accuracy, 1000, 1);
  const animatedRaw = useCountUp(result.rawWpm, 800);
  const animatedConsistency = useCountUp(result.consistency, 800, 0);

  // Chart labels: 1, 2, 3, ... seconds
  const labels = result.wpmHistory.map((_, i) => `${i + 1}`);

  // Max error count for sizing dots
  const maxError = Math.max(...result.errorHistory, 1);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'wpm',
        data: result.wpmHistory,
        borderColor: mainColor,
        backgroundColor: `${mainColor}20`,
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: mainColor,
        order: 2,
      },
      {
        label: 'raw',
        data: result.rawWpmHistory,
        borderColor: subColor,
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: subColor,
        order: 3,
      },
      {
        label: 'errors',
        data: result.errorHistory.map((e) => (e > 0 ? e : null)),
        borderColor: 'transparent',
        backgroundColor: errorColor,
        fill: false,
        showLine: false,
        pointRadius: result.errorHistory.map((e) =>
          e > 0 ? Math.max(3, (e / maxError) * 8) : 0
        ),
        pointHoverRadius: result.errorHistory.map((e) =>
          e > 0 ? Math.max(4, (e / maxError) * 10) : 0
        ),
        pointStyle: 'circle',
        order: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2.5,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: bgColor,
        titleColor: textColor,
        bodyColor: subColor,
        borderColor: subAltColor,
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        callbacks: {
          title: (items: { label: string }[]) => `${items[0]?.label}s`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: `${subAltColor}40`,
          drawBorder: false,
        },
        ticks: {
          color: subColor,
          font: { family: 'monospace', size: 11 },
          maxTicksLimit: 15,
        },
        title: {
          display: true,
          text: 'seconds',
          color: subColor,
          font: { family: 'monospace', size: 11 },
        },
      },
      y: {
        grid: {
          color: `${subAltColor}30`,
          drawBorder: false,
        },
        ticks: {
          color: subColor,
          font: { family: 'monospace', size: 11 },
        },
        title: {
          display: true,
          text: 'words per minute',
          color: subColor,
          font: { family: 'monospace', size: 11 },
        },
        beginAtZero: true,
      },
    },
  };

  // Keyboard shortcut: Tab to restart, Escape to restart
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        onRestart();
      } else if (e.key === 'Escape') {
        onRestart();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onRestart]);

  return (
    <div
      ref={containerRef}
      className="result-screen"
      style={{
        animation: 'resultFadeIn 0.6s ease-out forwards',
        opacity: 0,
        maxWidth: '900px',
        width: '100%',
        margin: '0 auto',
        padding: '2rem 1rem',
        fontFamily: "'Roboto Mono', monospace",
      }}
    >
      {/* Inline keyframes */}
      <style>{`
        @keyframes resultFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .result-stat-label {
          font-size: 0.75rem;
          color: var(--sub-color, #646669);
          text-transform: lowercase;
          letter-spacing: 0.02em;
        }
        .result-stat-value {
          font-family: 'Roboto Mono', monospace;
        }
        .result-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          font-family: 'Roboto Mono', monospace;
          font-size: 0.875rem;
          transition: all 0.15s ease;
          color: var(--sub-color, #646669);
          background: var(--sub-alt-color, #2c2e31);
        }
        .result-btn:hover {
          color: var(--text-color, #d1d0c5);
          background: var(--sub-color, #646669);
        }
        .result-btn:focus {
          outline: 2px solid var(--main-color, #e2b714);
          outline-offset: 2px;
        }
      `}</style>

      {/* Top stats: WPM + Accuracy */}
      <div
        style={{
          display: 'flex',
          gap: '3rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div className="result-stat-label">wpm</div>
          <div
            className="result-stat-value"
            style={{
              fontSize: '3.5rem',
              fontWeight: 700,
              lineHeight: 1.1,
              color: mainColor,
            }}
          >
            {animatedWpm}
          </div>
        </div>
        <div>
          <div className="result-stat-label">acc</div>
          <div
            className="result-stat-value"
            style={{
              fontSize: '3.5rem',
              fontWeight: 700,
              lineHeight: 1.1,
              color: mainColor,
            }}
          >
            {animatedAccuracy}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <div
        style={{
          background: bgColor,
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Inline legend */}
        <div
          style={{
            display: 'flex',
            gap: '1.25rem',
            marginBottom: '0.5rem',
            fontSize: '0.75rem',
            fontFamily: "'Roboto Mono', monospace",
          }}
        >
          <span style={{ color: mainColor }}>-- wpm</span>
          <span style={{ color: subColor }}>- - raw</span>
          <span style={{ color: errorColor }}>
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: errorColor,
                marginRight: 4,
                verticalAlign: 'middle',
              }}
            />
            errors
          </span>
        </div>
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '1rem 2rem',
          marginBottom: '2rem',
        }}
      >
        <StatItem
          label="test type"
          value={`${result.mode} ${result.modeOption}${result.mode === 'time' ? 's' : ''}`}
          color={textColor}
        />
        <StatItem label="raw" value={`${animatedRaw}`} color={textColor} />
        <StatItem
          label="characters"
          value={`${result.correctChars}/${result.incorrectChars}/${result.extraChars}/${result.missedChars}`}
          color={textColor}
        />
        <StatItem
          label="consistency"
          value={`${animatedConsistency}%`}
          color={textColor}
        />
        <StatItem
          label="time"
          value={`${result.time.toFixed(1)}s`}
          color={textColor}
        />
      </div>

      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center',
        }}
      >
        <button className="result-btn" onClick={onRestart} title="Next test (Tab)">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          restart
        </button>
        <button className="result-btn" onClick={onRepeat} title="Repeat test">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
          repeat
        </button>
      </div>
    </div>
  );
}

/** A small stat item with label + value. */
function StatItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div>
      <div className="result-stat-label">{label}</div>
      <div
        className="result-stat-value"
        style={{
          fontSize: '1.25rem',
          fontWeight: 500,
          color,
          lineHeight: 1.4,
        }}
      >
        {value}
      </div>
    </div>
  );
}
