"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

interface ThemeProviderProps {
  children: React.ReactNode;
  nonce?: string;
  forcedTheme?: 'light' | 'nyungwe';
}

export function ThemeProvider({ children, nonce, forcedTheme }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme={forcedTheme}
      enableSystem={false}
      enableColorScheme={false}
      disableTransitionOnChange
      nonce={nonce}
    >
      {children}
    </NextThemesProvider>
  );
}
