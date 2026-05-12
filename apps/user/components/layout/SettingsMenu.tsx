"use client";

import { useState } from "react";
import { 
  Settings, 
  ChevronRight, 
  ChevronLeft, 
  Moon, 
  Sun, 
  Monitor, 
  Globe, 
  LogOut, 
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
    if (typeof document !== 'undefined') {
       // eslint-disable-next-line react-hooks/immutability
       document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000`;
       window.location.reload();
    }
  };

  return (
    <div className="w-[300px] bg-background border border-elevated rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-top-2 duration-300 text-text-primary">
      {view === "main" ? (
        <div className="flex flex-col py-2">
          <div className="flex flex-col px-2">
            {isLoggedIn && user && (
              <button 
                onClick={() => {
                  router.push(`/@${user.username}`);
                  onClose();
                }}
                className="flex items-center gap-4 px-4 py-3.5 hover:bg-hover rounded-2xl transition-all duration-200 text-start group"
              >
                <div className="p-2 bg-surface rounded-xl group-hover:scale-110 transition-transform">
                  <User size={18} />
                </div>
                <span className="flex-1 font-bold text-[15px]">{t('settings.profile')}</span>
              </button>
            )}

            <button className="flex items-center gap-4 px-4 py-3.5 hover:bg-hover rounded-2xl transition-all duration-200 text-start group">
              <div className="p-2 bg-surface rounded-xl group-hover:rotate-45 transition-transform">
                <Settings size={18} />
              </div>
              <span className="flex-1 font-bold text-[15px]">{t('settings.common')}</span>
            </button>

            <button 
              onClick={() => setView("language")}
              className="flex items-center gap-4 px-4 py-3.5 hover:bg-hover rounded-2xl transition-all duration-200 text-start group"
            >
              <div className="p-2 bg-surface rounded-xl group-hover:scale-110 transition-transform">
                <Globe size={18} />
              </div>
              <span className="flex-1 font-bold text-[15px]">{t('settings.language')}</span>
              <div className="flex items-center gap-1.5 text-text-muted">
                <span className="text-xs font-bold">{languages.find(l => l.code === locale)?.name}</span>
                <ChevronRight size={16} />
              </div>
            </button>

            <div className="flex items-center justify-between px-4 py-3 hover:bg-hover rounded-2xl transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-surface rounded-xl">
                  {theme === "dark" ? <Moon size={18} /> : theme === "light" ? <Sun size={18} /> : <Monitor size={18} />}
                </div>
                <span className="font-bold text-[15px]">{t('settings.darkMode')}</span>
              </div>
              <div className="flex bg-surface rounded-full p-1 gap-1 border border-elevated">
                <button 
                  onClick={() => setTheme("system")}
                  className={`p-2 rounded-full transition-all ${theme === "system" ? "bg-background shadow-md scale-110 text-brand" : "text-text-muted hover:text-text-primary"}`}
                >
                  <Monitor size={14} />
                </button>
                <button 
                  onClick={() => setTheme("dark")}
                  className={`p-2 rounded-full transition-all ${theme === "dark" ? "bg-background shadow-md scale-110 text-brand" : "text-text-muted hover:text-text-primary"}`}
                >
                  <Moon size={14} />
                </button>
                <button 
                  onClick={() => setTheme("light")}
                  className={`p-2 rounded-full transition-all ${theme === "light" ? "bg-background shadow-md scale-110 text-brand" : "text-text-muted hover:text-text-primary"}`}
                >
                  <Sun size={14} />
                </button>
              </div>
            </div>

            <div className="h-[1px] bg-elevated my-2 mx-4" />

            {onLogout && (
              <button 
                onClick={onLogout}
                className="flex items-center gap-4 px-4 py-3.5 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all duration-200 text-start group"
              >
                <div className="p-2 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl group-hover:scale-110 transition-transform">
                  <LogOut size={18} />
                </div>
                <span className="flex-1 font-bold text-[15px] text-red-600 dark:text-red-400">{t('settings.logout')}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col py-2 min-h-[220px]">
          <div className="px-4 py-3 flex items-center border-b border-elevated mb-2">
            <button 
              onClick={() => setView("main")}
              className="p-2 hover:bg-hover rounded-full mr-3 text-text-secondary transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="font-black text-lg">{t('settings.language')}</span>
          </div>

          <div className="flex flex-col px-2">
            {languages.map((lang) => (
              <button 
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 text-start ${locale === lang.code ? "bg-brand/5 text-brand" : "hover:bg-hover"}`}
              >
                <span className={`text-[15px] ${locale === lang.code ? "font-black" : "font-bold text-text-secondary"}`}>
                  {lang.name}
                </span>
                {locale === lang.code && <div className="w-2 h-2 bg-brand rounded-full animate-pulse" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
