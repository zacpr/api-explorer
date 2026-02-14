import { useState, useEffect } from 'react';
import { themes, type ThemeName, getStoredTheme, applyTheme } from '@/services/theme';

function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('indigo');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const stored = getStoredTheme();
    setCurrentTheme(stored);
    applyTheme(stored);
  }, []);

  const handleSelect = (themeName: ThemeName) => {
    setCurrentTheme(themeName);
    applyTheme(themeName);
    setIsOpen(false);
  };

  return (
    <div className="theme-selector">
      <button 
        className="theme-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Change theme"
      >
        <span 
          className="theme-dot" 
          style={{ background: themes[currentTheme].accent }}
        />
        <span className="theme-label">Theme</span>
      </button>
      
      {isOpen && (
        <>
          <div className="theme-backdrop" onClick={() => setIsOpen(false)} />
          <div className="theme-dropdown">
            {Object.values(themes).map((theme) => (
              <button
                key={theme.name}
                className={`theme-option ${currentTheme === theme.name ? 'active' : ''}`}
                onClick={() => handleSelect(theme.name)}
              >
                <span 
                  className="theme-dot" 
                  style={{ background: theme.accent }}
                />
                <span className="theme-name">{theme.label}</span>
                {currentTheme === theme.name && <span className="check">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ThemeSelector;
