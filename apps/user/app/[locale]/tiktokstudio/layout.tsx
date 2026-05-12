'use client';

import React from 'react';
import { LayoutDashboard, Video, Upload, Settings, HelpCircle, MessageSquare, PieChart } from 'lucide-react';
import { Link, usePathname } from '@/i18n/routing';
import { Logo } from '@/components/layout/LayoutHelpers';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import Image from 'next/image';

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.auth.user);

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', href: '/toptopstudio' },
    { icon: <Video size={20} />, label: 'Content', href: '/toptopstudio/manage' },
    { icon: <PieChart size={20} />, label: 'Analytics', href: '/toptopstudio/analytics' },
    { icon: <MessageSquare size={20} />, label: 'Comments', href: '/toptopstudio/comments' },
  ];

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 bg-white dark:bg-zinc-900 z-30">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
             <Logo size="sm" />
             <span className="text-xl font-bold">TopTop Studio</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/toptopstudio/upload" className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-bold transition shadow-sm">
             <Upload size={18} />
             <span>Upload</span>
          </Link>
          
          {user && (
            <div className="flex items-center gap-2 pl-4 border-l border-zinc-200 dark:border-zinc-800">
              <div className="w-8 h-8 rounded-full overflow-hidden relative border border-zinc-200 dark:border-zinc-700">
                {user.avatarUrl ? (
                  <Image src={user.avatarUrl} alt={user.nickname ?? ""} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-sm font-bold">
                    {user.username?.[0].toUpperCase()}
                  </div>
                )}
              </div>
              <span className="hidden sm:block text-sm font-medium">{user.nickname ?? user.username}</span>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col p-4 gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                  isActive 
                    ? 'bg-red-50 dark:bg-red-950/30 text-red-500' 
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
          
          <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
             <button className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400 font-medium">
                <Settings size={20} />
                <span>Settings</span>
             </button>
             <button className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400 font-medium">
                <HelpCircle size={20} />
                <span>Feedback</span>
             </button>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-black p-8">
           <div className="max-w-6xl mx-auto">
             {children}
           </div>
        </main>
      </div>
    </div>
  );
}
