'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Video, Users, Heart, Eye, TrendingUp } from 'lucide-react';

export default function StudioDashboard() {
  const user = useSelector((state: RootState) => state.auth.user);

  const stats = [
    { label: 'Total Views', value: '1.2M', icon: <Eye className="text-blue-500" />, trend: '+12%' },
    { label: 'Followers', value: '45.2K', icon: <Users className="text-purple-500" />, trend: '+5%' },
    { label: 'Total Likes', value: '890K', icon: <Heart className="text-red-500" />, trend: '+18%' },
    { label: 'Video Count', value: user?.videoCount || 0, icon: <Video className="text-green-500" />, trend: '0%' },
  ];

  return (
    <div className="py-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-zinc-500">Welcome back, {user?.nickname || user?.username}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
               <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  {stat.icon}
               </div>
               <span className="text-xs font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full flex items-center gap-1">
                 <TrendingUp size={12} />
                 {stat.trend}
               </span>
            </div>
            <p className="text-zinc-500 text-sm font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h3 className="font-bold mb-4">Latest Performance</h3>
            <div className="h-64 flex items-center justify-center text-zinc-400 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-lg">
               Chart Placeholder
            </div>
         </div>
         <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h3 className="font-bold mb-4">Recent Comments</h3>
            <div className="flex flex-col gap-4">
               {[1, 2, 3].map(i => (
                 <div key={i} className="flex gap-3 pb-4 border-b border-zinc-50 dark:border-zinc-800 last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                    <div className="flex-1">
                       <p className="text-sm font-bold">User {i}</p>
                       <p className="text-xs text-zinc-500">Great video! Love the content.</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
