'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  createElement,
} from 'react';
import { defaultSettings, Settings } from '@/config/settings';
import { getTheme, Theme } from '@/config/themes';

interface SettingsContextType {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetSettings: () => void;
  currentTheme: Theme;
}

const STORAGE_KEY = 'fastype-settings';

const SettingsContext = createContext<SettingsContextType | null>(null);

function loadSettings(): Settings {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults so new keys are always present
      return { ...defaultSettings, ...parsed };
    }
  } catch {
    // Corrupted data — fall back to defaults
  }
  return defaultSettings;
}

function saveSettings(settings: Settings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.style.setProperty('--bg-color', theme.colors.bg);
  root.style.setProperty('--main-color', theme.colors.main);
  root.style.setProperty('--caret-color', theme.colors.caret);
  root.style.setProperty('--sub-color', theme.colors.sub);
  root.style.setProperty('--sub-alt-color', theme.colors.subAlt);
  root.style.setProperty('--text-color', theme.colors.text);
  root.style.setProperty('--error-color', theme.colors.error);
  root.style.setProperty('--error-extra-color', theme.colors.errorExtra);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    setMounted(true);
  }, []);

  // Resolve the current theme object
  const currentTheme = getTheme(settings.theme);

  // Apply theme CSS variables whenever the theme changes
  useEffect(() => {
    if (!mounted) return;
    applyTheme(currentTheme);
  }, [currentTheme, mounted]);

  // Save to localStorage whenever settings change
  useEffect(() => {
    if (!mounted) return;
    saveSettings(settings);
  }, [settings, mounted]);

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const value: SettingsContextType = {
    settings,
    updateSetting,
    resetSettings,
    currentTheme,
  };

  return createElement(SettingsContext.Provider, { value }, children);
}

export function useSettings(): SettingsContextType {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
}
