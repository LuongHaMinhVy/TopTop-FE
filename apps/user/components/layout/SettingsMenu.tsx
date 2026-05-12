"use client";

import { useState } from "react";
import { 
  Settings, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Moon, 
  Sun, 
  Monitor, 
  Globe, 
  LogOut, 
  X,
  User
} from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

interface SettingsMenuProps {
  onClose: () => void;
  onLogout?: () => void;
  isLoggedIn?: boolean;
}

export function SettingsMenu({ onClose, onLogout, isLoggedIn }: SettingsMenuProps) {
  const t = useTranslations();
  const locale = useLocale();
  const { theme, setTheme } = useTheme();
  const [view, setView] = useState<"main" | "language">("main");
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);

  const languages = [
    { code: "vi", name: "Tiếng Việt" },
    { code: "en", name: "English (US)" },
  ];

  const handleLanguageChange = (code: string) => {
    document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <div className="w-[280px] bg-background border border-elevated rounded-xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
      {view === "main" ? (
        <div className="flex flex-col py-1">
          <div className="flex flex-col">
            {isLoggedIn && user && (
              <button 
                onClick={() => {
                  router.push(`/@${user.username}`);
                  onClose();
                }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-hover transition-colors text-start"
              >
                <User size={20} />
                <span className="flex-1 font-semibold text-[15px]">{t('settings.profile')}</span>
              </button>
            )}

            <button className="flex items-center gap-3 px-4 py-3 hover:bg-hover transition-colors text-start">
              <Settings size={20} />
              <span className="flex-1 font-semibold text-[15px]">{t('settings.common')}</span>
            </button>

            <button 
              onClick={() => setView("language")}
              className="flex items-center gap-3 px-4 py-3 hover:bg-hover transition-colors text-start"
            >
              <Globe size={20} />
              <span className="flex-1 font-semibold text-[15px]">{t('settings.language')}</span>
              <div className="flex items-center gap-1 text-text-muted">
                <span className="text-[14px]">{languages.find(l => l.code === locale)?.name}</span>
                <ChevronRight size={18} />
              </div>
            </button>

            <div className="flex items-center justify-between px-4 py-2 hover:bg-hover transition-colors">
              <div className="flex items-center gap-3">
                <Moon size={20} />
                <span className="font-semibold text-[15px]">{t('settings.darkMode')}</span>
              </div>
              <div className="flex bg-elevated/50 rounded-full p-1 gap-1">
                <button 
                  onClick={() => setTheme("system")}
                  className={`p-1.5 rounded-full transition-all ${theme === "system" ? "bg-background shadow-sm text-text-primary" : "text-text-muted hover:text-text-primary"}`}
                >
                  <Monitor size={14} />
                </button>
                <button 
                  onClick={() => setTheme("dark")}
                  className={`p-1.5 rounded-full transition-all ${theme === "dark" ? "bg-background shadow-sm text-text-primary" : "text-text-muted hover:text-text-primary"}`}
                >
                  <Moon size={14} />
                </button>
                <button 
                  onClick={() => setTheme("light")}
                  className={`p-1.5 rounded-full transition-all ${theme === "light" ? "bg-background shadow-sm text-text-primary" : "text-text-muted hover:text-text-primary"}`}
                >
                  <Sun size={14} />
                </button>
              </div>
            </div>

            <div className="h-[1px] bg-elevated/50 my-1 mx-2" />

            {onLogout && (
              <button 
                onClick={onLogout}
                className="flex items-center gap-3 px-4 py-3 hover:bg-hover transition-colors text-start"
              >
                <LogOut size={20} />
                <span className="flex-1 font-semibold text-[15px]">{t('settings.logout')}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col py-1 min-h-[200px]">
          <div className="px-2 py-2 flex items-center border-b border-elevated mb-1">
            <button 
              onClick={() => setView("main")}
              className="p-1.5 hover:bg-hover rounded-full mr-2"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="font-bold text-[17px]">{t('settings.language')}</span>
          </div>

          <div className="flex flex-col">
            {languages.map((lang) => (
              <button 
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className="flex items-center justify-between px-4 py-3 hover:bg-hover transition-colors text-start"
              >
                <span className={`text-[15px] ${locale === lang.code ? "font-bold" : "font-medium"}`}>
                  {lang.name}
                </span>
                {locale === lang.code && <Check size={18} className="text-brand" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
