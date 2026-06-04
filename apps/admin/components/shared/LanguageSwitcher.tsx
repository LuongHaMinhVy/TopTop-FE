"use client";

import { useLocale } from "next-intl";
import {
  requestRuntimeLocaleChange,
  type AppLocale,
} from "@/components/providers/RuntimeIntlProvider";

export function LanguageSwitcher() {
  const locale = useLocale();
  const nextLocale: AppLocale = locale === "vi" ? "en" : "vi";
  const nextLabel = nextLocale.toUpperCase();

  const handleLanguageChange = () => {
    requestRuntimeLocaleChange(nextLocale);
  };

  return (
    <button
      type="button"
      onClick={handleLanguageChange}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-elevated bg-background px-3 text-text-muted shadow-sm transition hover:bg-hover hover:text-text-primary active:scale-95"
      aria-label={`Switch language to ${nextLabel}`}
    >
      <span className="text-xs font-black">{nextLabel}</span>
    </button>
  );
}
