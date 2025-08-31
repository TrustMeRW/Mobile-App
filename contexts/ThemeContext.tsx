import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { lightColors } from '@/constants/theme';

export type Theme = 'light';

interface ThemeContextType {
  theme: Theme;
  colors: typeof lightColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const theme: Theme = 'light';
  const colors = lightColors;

  return (
    <ThemeContext.Provider value={{ theme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
