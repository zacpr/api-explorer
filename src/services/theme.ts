export type ThemeName = 'indigo' | 'cyan' | 'rose' | 'amber' | 'emerald';

export interface Theme {
  name: ThemeName;
  label: string;
  accent: string;
  accentHover: string;
  accentGlow: string;
}

export const themes: Record<ThemeName, Theme> = {
  indigo: {
    name: 'indigo',
    label: 'Indigo (Default)',
    accent: '#6366f1',
    accentHover: '#818cf8',
    accentGlow: 'rgba(99, 102, 241, 0.3)',
  },
  cyan: {
    name: 'cyan',
    label: 'Ocean Cyan',
    accent: '#06b6d4',
    accentHover: '#22d3ee',
    accentGlow: 'rgba(6, 182, 212, 0.3)',
  },
  rose: {
    name: 'rose',
    label: 'Rose Red',
    accent: '#f43f5e',
    accentHover: '#fb7185',
    accentGlow: 'rgba(244, 63, 94, 0.3)',
  },
  amber: {
    name: 'amber',
    label: 'Amber Gold',
    accent: '#f59e0b',
    accentHover: '#fbbf24',
    accentGlow: 'rgba(245, 158, 11, 0.3)',
  },
  emerald: {
    name: 'emerald',
    label: 'Emerald Green',
    accent: '#10b981',
    accentHover: '#34d399',
    accentGlow: 'rgba(16, 185, 129, 0.3)',
  },
};

const STORAGE_KEY = 'api-explorer-theme';

export function getStoredTheme(): ThemeName {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && themes[stored as ThemeName]) {
      return stored as ThemeName;
    }
  } catch {
    // Ignore storage errors
  }
  return 'indigo';
}

export function storeTheme(theme: ThemeName): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore storage errors
  }
}

export function applyTheme(themeName: ThemeName): void {
  const theme = themes[themeName];
  const root = document.documentElement;
  
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--accent-hover', theme.accentHover);
  root.style.setProperty('--accent-glow', theme.accentGlow);
  
  storeTheme(themeName);
}
