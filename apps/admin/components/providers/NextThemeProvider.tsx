"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const storageKey = "theme";
const mediaQuery = "(prefers-color-scheme: dark)";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia(mediaQuery).matches ? "dark" : "light";
}

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function applyTheme(theme: Theme, resolvedTheme: ResolvedTheme) {
  const nextTheme = theme === "system" ? resolvedTheme : theme;
  document.documentElement.classList.toggle("dark", nextTheme === "dark");
  document.documentElement.style.colorScheme = nextTheme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    const stored = window.localStorage.getItem(storageKey);
    return isTheme(stored) ? stored : "system";
  });
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => {
    const resolved = getSystemTheme();
    return resolved;
  });

  // Apply theme to DOM once on mount (after hydration)
  useEffect(() => {
    applyTheme(theme, systemTheme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const media = window.matchMedia(mediaQuery);
    const handleChange = () => {
      const nextSystemTheme = getSystemTheme();
      setSystemTheme(nextSystemTheme);
      setThemeState((currentTheme) => {
        applyTheme(currentTheme, nextSystemTheme);
        return currentTheme;
      });
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      const nextTheme = isTheme(event.newValue) ? event.newValue : "system";
      setThemeState(nextTheme);
      applyTheme(nextTheme, getSystemTheme());
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setTheme = useCallback((nextTheme: Theme) => {
    const nextSystemTheme = getSystemTheme();
    window.localStorage.setItem(storageKey, nextTheme);
    setThemeState(nextTheme);
    setSystemTheme(nextSystemTheme);
    applyTheme(nextTheme, nextSystemTheme);
  }, []);

  const resolvedTheme = theme === "system" ? systemTheme : theme;

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [resolvedTheme, setTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: "system" as Theme,
      resolvedTheme: "light" as ResolvedTheme,
      setTheme: () => undefined,
    };
  }
  return context;
}
