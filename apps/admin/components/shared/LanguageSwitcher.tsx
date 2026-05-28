"use client";

import { Languages } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";

const languages = [
  { code: "vi", label: "VI" },
  { code: "en", label: "EN" },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="inline-flex h-10 items-center gap-1 rounded-lg border border-elevated bg-background p-1 text-text-muted shadow-sm">
      <Languages className="ml-2 h-4 w-4" />
      {languages.map((language) => {
        const isActive = locale === language.code;

        return (
          <button
            key={language.code}
            type="button"
            onClick={() => router.replace(pathname, { locale: language.code })}
            className={`h-8 rounded-md px-2 text-xs font-black transition ${
              isActive
                ? "bg-brand text-white"
                : "hover:bg-hover hover:text-text-primary"
            }`}
            aria-pressed={isActive}
          >
            {language.label}
          </button>
        );
      })}
    </div>
  );
}
