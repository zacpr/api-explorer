export type ThemeName = 
  | 'indigo' 
  | 'cyberpunk'
  | 'nord'
  | 'synthwave'
  | 'monochrome'
  | 'matrix'
  | 'sunset'
  | 'dracula'
  | 'tokyo-night'
  | 'gruvbox';

export interface Theme {
  name: ThemeName;
  label: string;
  description: string;
  accent: string;
  accentHover: string;
  accentGlow: string;
  // Extended palette for richer theming
  bgGradient: string;
  methodColors: {
    get: string;
    post: string;
    put: string;
    patch: string;
    delete: string;
  };
}

export const themes: Record<ThemeName, Theme> = {
  // Classic professional
  indigo: {
    name: 'indigo',
    label: 'Indigo',
    description: 'Classic professional purple-blue',
    accent: '#6366f1',
    accentHover: '#818cf8',
    accentGlow: 'rgba(99, 102, 241, 0.3)',
    bgGradient: 'radial-gradient(ellipse at 0% 0%, rgba(99, 102, 241, 0.08) 0%, transparent 50%)',
    methodColors: {
      get: '#10b981',
      post: '#3b82f6',
      put: '#f59e0b',
      patch: '#8b5cf6',
      delete: '#ef4444',
    },
  },

  // Cyberpunk neon
  cyberpunk: {
    name: 'cyberpunk',
    label: 'Cyberpunk',
    description: 'High contrast neon on dark',
    accent: '#00f5d4',
    accentHover: '#72efdd',
    accentGlow: 'rgba(0, 245, 212, 0.4)',
    bgGradient: `
      radial-gradient(ellipse at 0% 0%, rgba(0, 245, 212, 0.1) 0%, transparent 50%),
      radial-gradient(ellipse at 100% 100%, rgba(245, 0, 182, 0.08) 0%, transparent 50%)
    `,
    methodColors: {
      get: '#00f5d4',
      post: '#00bbf9',
      put: '#fee440',
      patch: '#f72585',
      delete: '#ff006e',
    },
  },

  // Nord - arctic bluish
  nord: {
    name: 'nord',
    label: 'Nord',
    description: 'Arctic, north-bluish color palette',
    accent: '#88c0d0',
    accentHover: '#8fbcbb',
    accentGlow: 'rgba(136, 192, 208, 0.35)',
    bgGradient: `
      radial-gradient(ellipse at 0% 0%, rgba(136, 192, 208, 0.1) 0%, transparent 50%),
      radial-gradient(ellipse at 100% 100%, rgba(129, 161, 193, 0.06) 0%, transparent 50%)
    `,
    methodColors: {
      get: '#a3be8c',
      post: '#5e81ac',
      put: '#ebcb8b',
      patch: '#b48ead',
      delete: '#bf616a',
    },
  },

  // Synthwave / Retrowave
  synthwave: {
    name: 'synthwave',
    label: 'Synthwave',
    description: '80s retro neon sunset vibes',
    accent: '#ff00ff',
    accentHover: '#ff71ce',
    accentGlow: 'rgba(255, 0, 255, 0.4)',
    bgGradient: `
      radial-gradient(ellipse at 50% 100%, rgba(255, 0, 255, 0.1) 0%, transparent 60%),
      radial-gradient(ellipse at 0% 0%, rgba(0, 255, 255, 0.08) 0%, transparent 50%),
      linear-gradient(180deg, #0a0a1a 0%, #1a0a2e 100%)
    `,
    methodColors: {
      get: '#00ffff',
      post: '#00b8ff',
      put: '#ffea00',
      patch: '#ff00ff',
      delete: '#ff0055',
    },
  },

  // Monochrome with accent
  monochrome: {
    name: 'monochrome',
    label: 'Monochrome',
    description: 'Clean grayscale with subtle accent',
    accent: '#94a3b8',
    accentHover: '#cbd5e1',
    accentGlow: 'rgba(148, 163, 184, 0.25)',
    bgGradient: 'radial-gradient(ellipse at 50% 0%, rgba(148, 163, 184, 0.06) 0%, transparent 50%)',
    methodColors: {
      get: '#4ade80',
      post: '#60a5fa',
      put: '#fbbf24',
      patch: '#a78bfa',
      delete: '#f87171',
    },
  },

  // Matrix / Terminal green
  matrix: {
    name: 'matrix',
    label: 'Matrix',
    description: 'Terminal hacker green aesthetic',
    accent: '#00ff41',
    accentHover: '#39ff14',
    accentGlow: 'rgba(0, 255, 65, 0.35)',
    bgGradient: `
      radial-gradient(ellipse at 0% 0%, rgba(0, 255, 65, 0.08) 0%, transparent 50%),
      linear-gradient(180deg, #000000 0%, #051405 100%)
    `,
    methodColors: {
      get: '#00ff41',
      post: '#00d9ff',
      put: '#ffee00',
      patch: '#ff00ff',
      delete: '#ff3333',
    },
  },

  // Sunset gradient
  sunset: {
    name: 'sunset',
    label: 'Sunset',
    description: 'Warm oranges, pinks and purples',
    accent: '#ff6b6b',
    accentHover: '#ff8e53',
    accentGlow: 'rgba(255, 107, 107, 0.35)',
    bgGradient: `
      radial-gradient(ellipse at 100% 0%, rgba(255, 107, 107, 0.1) 0%, transparent 50%),
      radial-gradient(ellipse at 0% 100%, rgba(142, 68, 173, 0.08) 0%, transparent 50%)
    `,
    methodColors: {
      get: '#2ecc71',
      post: '#3498db',
      put: '#f39c12',
      patch: '#9b59b6',
      delete: '#e74c3c',
    },
  },

  // Dracula
  dracula: {
    name: 'dracula',
    label: 'Dracula',
    description: 'Dark theme with vibrant colors',
    accent: '#bd93f9',
    accentHover: '#ff79c6',
    accentGlow: 'rgba(189, 147, 249, 0.35)',
    bgGradient: `
      radial-gradient(ellipse at 0% 0%, rgba(189, 147, 249, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse at 100% 100%, rgba(255, 121, 198, 0.05) 0%, transparent 50%)
    `,
    methodColors: {
      get: '#50fa7b',
      post: '#8be9fd',
      put: '#ffb86c',
      patch: '#bd93f9',
      delete: '#ff5555',
    },
  },

  // Tokyo Night
  'tokyo-night': {
    name: 'tokyo-night',
    label: 'Tokyo Night',
    description: 'Inspired by Tokyo city lights at night',
    accent: '#7aa2f7',
    accentHover: '#bb9af7',
    accentGlow: 'rgba(122, 162, 247, 0.35)',
    bgGradient: `
      radial-gradient(ellipse at 50% 0%, rgba(122, 162, 247, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse at 0% 100%, rgba(187, 154, 247, 0.05) 0%, transparent 50%)
    `,
    methodColors: {
      get: '#9ece6a',
      post: '#7aa2f7',
      put: '#e0af68',
      patch: '#bb9af7',
      delete: '#f7768e',
    },
  },

  // Gruvbox
  gruvbox: {
    name: 'gruvbox',
    label: 'Gruvbox',
    description: 'Retro groove color scheme',
    accent: '#fabd2f',
    accentHover: '#fe8019',
    accentGlow: 'rgba(250, 189, 47, 0.35)',
    bgGradient: `
      radial-gradient(ellipse at 0% 0%, rgba(250, 189, 47, 0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 100% 0%, rgba(184, 187, 38, 0.05) 0%, transparent 50%)
    `,
    methodColors: {
      get: '#b8bb26',
      post: '#83a598',
      put: '#fabd2f',
      patch: '#d3869b',
      delete: '#fb4934',
    },
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
  
  // Core accent colors
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--accent-hover', theme.accentHover);
  root.style.setProperty('--accent-glow', theme.accentGlow);
  
  // Method colors
  root.style.setProperty('--method-get', theme.methodColors.get);
  root.style.setProperty('--method-post', theme.methodColors.post);
  root.style.setProperty('--method-put', theme.methodColors.put);
  root.style.setProperty('--method-patch', theme.methodColors.patch);
  root.style.setProperty('--method-delete', theme.methodColors.delete);
  
  // Background gradient
  root.style.setProperty('--theme-bg-gradient', theme.bgGradient);
  
  storeTheme(themeName);
}

export function getThemeDescription(themeName: ThemeName): string {
  return themes[themeName].description;
}
