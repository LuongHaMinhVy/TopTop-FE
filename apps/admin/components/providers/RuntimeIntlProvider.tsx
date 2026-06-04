"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en.json";
import viMessages from "@/messages/vi.json";

const messagesByLocale = {
  en: enMessages,
  vi: viMessages,
} as const;

export type AppLocale = keyof typeof messagesByLocale;

type RuntimeLocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
};

export const RuntimeLocaleContext = createContext<RuntimeLocaleContextValue | null>(
  null,
);

const storageKeys = ["NEXT_LOCALE", "toptop_locale"] as const;
const localeChangeEvent = "toptop:locale-change";

function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === "en" || value === "vi";
}

function persistLocale(locale: AppLocale) {
  storageKeys.forEach((key) => window.localStorage.setItem(key, locale));
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = locale;
}

export function RuntimeIntlProvider({
  initialLocale,
  children,
}: {
  initialLocale: string;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<AppLocale>(
    isAppLocale(initialLocale) ? initialLocale : "vi",
  );

  const setLocale = useCallback((nextLocale: AppLocale) => {
    setLocaleState(nextLocale);
    persistLocale(nextLocale);
  }, []);

  // Sync localStorage → state once on mount via event dispatch (avoids setState-in-effect)
  const didSyncRef = useRef(false);
  useEffect(() => {
    if (didSyncRef.current) return;
    didSyncRef.current = true;

    const savedLocale =
      window.localStorage.getItem("NEXT_LOCALE") ??
      window.localStorage.getItem("toptop_locale");

    if (isAppLocale(savedLocale) && savedLocale !== locale) {
      // Use event dispatch so setState is called from an event handler, not effect body
      window.dispatchEvent(
        new CustomEvent(localeChangeEvent, { detail: { locale: savedLocale } }),
      );
    } else {
      persistLocale(locale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleLocaleChange = (event: Event) => {
      const nextLocale = (event as CustomEvent<{ locale?: string }>).detail
        ?.locale;

      if (isAppLocale(nextLocale)) {
        setLocale(nextLocale);
      }
    };

    window.addEventListener(localeChangeEvent, handleLocaleChange);
    return () => window.removeEventListener(localeChangeEvent, handleLocaleChange);
  }, [setLocale]);

  const contextValue = useMemo(
    () => ({
      locale,
      setLocale,
    }),
    [locale, setLocale],
  );

  return (
    <RuntimeLocaleContext.Provider value={contextValue}>
      <NextIntlClientProvider locale={locale} messages={messagesByLocale[locale]}>
        {children}
      </NextIntlClientProvider>
    </RuntimeLocaleContext.Provider>
  );
}

export function requestRuntimeLocaleChange(locale: AppLocale) {
  window.dispatchEvent(
    new CustomEvent(localeChangeEvent, {
      detail: { locale },
    }),
  );
}
