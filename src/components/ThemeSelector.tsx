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

  const currentThemeData = themes[currentTheme];

  return (
    <div className="theme-selector">
      <button 
        className="theme-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title={`Theme: ${currentThemeData.label}`}
      >
        <div 
          className="theme-preview-strip" 
          style={{ 
            background: `linear-gradient(90deg, ${currentThemeData.accent}, ${currentThemeData.methodColors.get}, ${currentThemeData.methodColors.post})` 
          }}
        />
        <span className="theme-label">{currentThemeData.label}</span>
        <span className="theme-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <>
          <div className="theme-backdrop" onClick={() => setIsOpen(false)} />
          <div className="theme-dropdown">
            <div className="theme-header">
              <strong>Select Theme</strong>
              <span>{Object.keys(themes).length} available</span>
            </div>
            {Object.values(themes).map((theme) => (
              <button
                key={theme.name}
                className={`theme-option ${currentTheme === theme.name ? 'active' : ''}`}
                onClick={() => handleSelect(theme.name)}
              >
                <div className="theme-preview">
                  <div 
                    className="theme-color-bar"
                    style={{ 
                      background: `linear-gradient(90deg, ${theme.accent}, ${theme.methodColors.get}, ${theme.methodColors.post})` 
                    }}
                  />
                </div>
                <div className="theme-info">
                  <span className="theme-name">{theme.label}</span>
                  <span className="theme-description">{theme.description}</span>
                </div>
                {currentTheme === theme.name && (
                  <span className="theme-check">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ThemeSelector;
