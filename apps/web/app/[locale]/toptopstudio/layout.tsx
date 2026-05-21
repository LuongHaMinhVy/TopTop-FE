'use client';

import React from 'react';
import { ArrowLeft, LayoutDashboard, Video, Upload, Settings, HelpCircle, MessageSquare, PieChart } from 'lucide-react';
import { Link, usePathname } from '@/i18n/routing';
import { Logo } from '@/components/layout/LayoutHelpers';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { SettingsMenu } from '@/components/layout/SettingsMenu';
import { useState, useRef, useEffect } from 'react';
import { useLogoutMutation } from '@/hooks/auth-hooks';
import { useRouter } from '@/i18n/routing';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Studio');
  const pathname = usePathname();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const currentUserQuery = useCurrentUser();
  const effectiveUser = user ?? currentUserQuery.data?.data ?? null;
  const logoutMutation = useLogoutMutation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentUserQuery.isPending || currentUserQuery.isFetching) return;

    if (!effectiveUser) {
      router.push('/');
    }
  }, [
    currentUserQuery.isPending,
    currentUserQuery.isFetching,
    effectiveUser,
    router,
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };
    if (settingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [settingsOpen]);

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: t('dashboard'), href: '/toptopstudio' },
    { icon: <Video size={20} />, label: t('content'), href: '/toptopstudio/manage' },
    { icon: <PieChart size={20} />, label: t('analytics'), href: '/toptopstudio/analytics' },
    { icon: <MessageSquare size={20} />, label: t('comments'), href: '/toptopstudio/comments' },
  ];

  return (
    <div className="flex flex-col h-screen bg-background text-text-primary overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-elevated flex items-center justify-between px-6 bg-background z-30">
        <div className="flex items-center gap-2">
          <Link href="/toptopstudio" className="flex items-center gap-2">
             <Logo size="sm" />
             <span className="text-xl font-bold">{t('title')}</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/toptopstudio/upload" className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-bold transition shadow-sm">
             <Upload size={18} />
             <span>Upload</span>
          </Link>
          
          {effectiveUser && (
            <div className="flex items-center gap-4 pl-4 border-l border-elevated relative" ref={settingsRef}>
              <button 
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="flex items-center gap-2 group hover:bg-hover p-1.5 rounded-xl transition-all"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden relative border border-elevated group-hover:scale-105 transition-transform">
                  {effectiveUser.avatarUrl ? (
                    <Image
                      src={effectiveUser.avatarUrl}
                      alt={effectiveUser.nickname ?? ""}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface flex items-center justify-center text-sm font-bold">
                      {effectiveUser.username?.[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="hidden sm:block text-sm font-bold">{effectiveUser.nickname ?? effectiveUser.username}</span>
              </button>

              {settingsOpen && (
                <div className="absolute top-full right-0 mt-2 z-50">
                  <SettingsMenu 
                    onClose={() => setSettingsOpen(false)}
                    isLoggedIn={true}
                    onLogout={() => {
                      logoutMutation.mutate();
                      router.push('/');
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-elevated bg-background flex flex-col p-4 gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                  isActive 
                    ? 'bg-brand/10 text-brand' 
                    : 'hover:bg-hover text-text-secondary'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
          
          <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-elevated">
             <Link
               href="/"
               className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-hover transition-colors text-text-secondary font-medium"
             >
                <ArrowLeft size={20} />
                <span>{t('backToTopTop')}</span>
             </Link>
             <button 
               onClick={() => setSettingsOpen(!settingsOpen)}
               className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-hover transition-colors text-text-secondary font-medium"
             >
                <Settings size={20} />
                <span>{t('settings')}</span>
             </button>
             <button className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-hover transition-colors text-text-secondary font-medium">
                <HelpCircle size={20} />
                <span>{t('feedback')}</span>
             </button>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-surface p-8 custom-scrollbar">
           <div className="max-w-6xl mx-auto">
             {children}
           </div>
        </main>
      </div>
    </div>
  );
}
