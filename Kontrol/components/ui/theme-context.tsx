import * as SecureStore from 'expo-secure-store';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors } from './theme';

type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  isDark: boolean;
  colors: typeof lightColors;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'kontrol.theme';

async function isSecureStoreAvailable(): Promise<boolean> {
  try {
    return typeof SecureStore !== 'undefined' && await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

async function getPersistedTheme(): Promise<Theme | null> {
  try {
    if (await isSecureStoreAvailable()) {
      const savedTheme = await SecureStore.getItemAsync(STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme as Theme;
      }
    }
  } catch {
    // Fail silently, fallback to system/default
  }
  return null;
}

async function persistTheme(theme: Theme): Promise<void> {
  try {
    if (await isSecureStoreAvailable()) {
      await SecureStore.setItemAsync(STORAGE_KEY, theme);
    }
  } catch {
    // Fail silently
  }
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    async function loadTheme() {
      const savedTheme = await getPersistedTheme();
      if (savedTheme) {
        setThemeState(savedTheme);
      } else if (systemColorScheme === 'dark' || systemColorScheme === 'light') {
        setThemeState(systemColorScheme as Theme);
      }
    }
    loadTheme();
  }, [systemColorScheme]);

  const setTheme = useCallback(async (newTheme: Theme) => {
    setThemeState(newTheme);
    await persistTheme(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  const isDark = theme === 'dark';
  const activeColors = isDark ? darkColors : lightColors;

  const value = useMemo(
    () => ({
      theme,
      isDark,
      colors: activeColors,
      toggleTheme,
      setTheme,
    }),
    [theme, isDark, activeColors, toggleTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside a ThemeProvider');
  }
  return context;
}
