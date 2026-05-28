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
    <div className="w-[270px] bg-background border border-elevated rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-top-2 duration-300 text-text-primary">
      {view === "main" ? (
        <div className="flex flex-col py-1.5">
          <div className="flex flex-col px-1.5">
            {isLoggedIn && user && (
              <button 
                onClick={() => {
                  router.push(`/@${user.username}`);
                  onClose();
                }}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-hover rounded-xl transition-all duration-200 text-start group"
              >
                <div className="p-1.5 bg-surface rounded-lg group-hover:scale-110 transition-transform">
                  <User size={16} />
                </div>
                <span className="flex-1 font-bold text-[14px]">{t('settings.profile')}</span>
              </button>
            )}

            <button
              onClick={() => {
                router.push("/setting");
                onClose();
              }}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-hover rounded-xl transition-all duration-200 text-start group"
            >
              <div className="p-1.5 bg-surface rounded-lg group-hover:rotate-45 transition-transform">
                <Settings size={16} />
              </div>
              <span className="flex-1 font-bold text-[14px]">{t('settings.common')}</span>
            </button>

            <button 
              onClick={() => setView("language")}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-hover rounded-xl transition-all duration-200 text-start group"
            >
              <div className="p-1.5 bg-surface rounded-lg group-hover:scale-110 transition-transform">
                <Globe size={16} />
              </div>
              <span className="flex-1 font-bold text-[14px]">{t('settings.language')}</span>
              <div className="flex items-center gap-1.5 text-text-muted">
                <span className="text-[11px] font-bold">{languages.find(l => l.code === locale)?.name}</span>
                <ChevronRight size={14} />
              </div>
            </button>

            <div className="flex items-center justify-between px-3 py-2.5 hover:bg-hover rounded-xl transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-surface rounded-lg">
                  {theme === "dark" ? <Moon size={16} /> : theme === "light" ? <Sun size={16} /> : <Monitor size={16} />}
                </div>
                <span className="font-bold text-[14px]">{t('settings.darkMode')}</span>
              </div>
              <div className="flex bg-surface rounded-full p-0.5 gap-0.5 border border-elevated">
                <button 
                  onClick={() => setTheme("system")}
                  className={`p-1.5 rounded-full transition-all ${theme === "system" ? "bg-background shadow-md scale-110 text-brand" : "text-text-muted hover:text-text-primary"}`}
                >
                  <Monitor size={13} />
                </button>
                <button 
                  onClick={() => setTheme("dark")}
                  className={`p-1.5 rounded-full transition-all ${theme === "dark" ? "bg-background shadow-md scale-110 text-brand" : "text-text-muted hover:text-text-primary"}`}
                >
                  <Moon size={13} />
                </button>
                <button 
                  onClick={() => setTheme("light")}
                  className={`p-1.5 rounded-full transition-all ${theme === "light" ? "bg-background shadow-md scale-110 text-brand" : "text-text-muted hover:text-text-primary"}`}
                >
                  <Sun size={13} />
                </button>
              </div>
            </div>

            <div className="h-[1px] bg-elevated my-1.5 mx-3" />

            {onLogout && (
              <button 
                onClick={onLogout}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all duration-200 text-start group"
              >
                <div className="p-1.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg group-hover:scale-110 transition-transform">
                  <LogOut size={16} />
                </div>
                <span className="flex-1 font-bold text-[14px] text-red-600 dark:text-red-400">{t('settings.logout')}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col py-1.5 min-h-[180px]">
          <div className="px-3 py-2.5 flex items-center border-b border-elevated mb-1.5">
            <button 
              onClick={() => setView("main")}
              className="p-1.5 hover:bg-hover rounded-full mr-2 text-text-secondary transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-black text-base">{t('settings.language')}</span>
          </div>

          <div className="flex flex-col px-1.5">
            {languages.map((lang) => (
              <button 
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 text-start ${locale === lang.code ? "bg-brand/5 text-brand" : "hover:bg-hover"}`}
              >
                <span className={`text-[14px] ${locale === lang.code ? "font-black" : "font-bold text-text-secondary"}`}>
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
