import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  themeColor: string;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  setThemeColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('themeMode') as ThemeMode) || 'light';
  });

  const [themeColor, setThemeColorState] = useState<string>(() => {
    return localStorage.getItem('themeColor') || '#3b82f6';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('themeColor', themeColor);
    document.documentElement.style.setProperty('--theme-color', themeColor);
  }, [themeColor]);

  const toggleMode = () => setModeState(prev => (prev === 'light' ? 'dark' : 'light'));
  const setMode = (m: ThemeMode) => setModeState(m);
  const setThemeColor = (c: string) => setThemeColorState(c);

  return (
    <ThemeContext.Provider value={{ mode, themeColor, toggleMode, setMode, setThemeColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
