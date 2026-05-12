"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";

/**
 * ThemeProvider wrapper to handle light/dark mode.
 * Updated to fix React 19 script injection issues.
 */
export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider 
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
