import { useState, useEffect, createContext, useContext } from 'react';

export type Theme = 'dark' | 'light';

// Get initial theme from localStorage or system preference
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';

  const stored = localStorage.getItem('theme') as Theme;
  if (stored && (stored === 'dark' || stored === 'light')) return stored;

  // Check system preference
  if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }

  return 'dark';
}

// Context for theme
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => { },
  setTheme: () => { },
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeProvider() {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setThemeState(getInitialTheme());
  }, []);

  useEffect(() => {
    // Apply theme class to document
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    setIsTransitioning(true);

    // Add transition class for smooth animation
    document.documentElement.classList.add('theme-transitioning');

    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);

    // Remove transition class after animation
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
      setIsTransitioning(false);
    }, 300);
  };

  return {
    theme,
    toggleTheme,
    setTheme,
    isTransitioning,
  };
}
