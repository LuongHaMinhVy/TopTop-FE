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
    <div className="flex h-screen flex-col overflow-hidden bg-background text-text-primary">
      {/* Header */}
      <header className="z-30 flex h-16 items-center justify-between border-b border-elevated bg-background px-4 sm:px-6">
        <div className="min-w-0 flex items-center gap-2">
          <Link href="/toptopstudio" className="flex items-center gap-2">
             <Logo size="sm" />
             <span className="max-w-[150px] truncate text-lg font-bold sm:max-w-none sm:text-xl">{t('title')}</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/toptopstudio/upload" className="btn-primary hover:btn-primary-hover flex items-center gap-2 rounded-md px-3 py-2 font-bold text-white shadow-sm transition sm:px-4">
             <Upload size={18} />
             <span className="hidden sm:inline">Upload</span>
          </Link>
          
          {effectiveUser && (
            <div className="relative flex items-center border-l border-elevated pl-2 sm:gap-4 sm:pl-4" ref={settingsRef}>
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

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        {/* Sidebar */}
        <aside className="flex shrink-0 gap-2 overflow-x-auto border-b border-elevated bg-background p-2 md:w-64 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors md:gap-3 md:px-4 md:py-3 md:text-base ${
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
          
          <div className="hidden md:mt-auto md:flex md:flex-col md:gap-2 md:border-t md:border-elevated md:pt-4">
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
        <main className="custom-scrollbar flex-1 overflow-y-auto bg-surface p-4 sm:p-6 lg:p-8">
           <div className="max-w-6xl mx-auto">
             {children}
           </div>
        </main>
      </div>
    </div>
  );
}
