"use client";

import { Bell } from "lucide-react";
import { useUnreadCount } from "@/hooks/notification-hooks";
import { useTranslations } from "next-intl";

interface Props {
  collapsed?: boolean;
  active?: boolean;
}

export default function NotificationBell({ collapsed, active }: Props) {
  const t = useTranslations("Main.sidebar");
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.data || 0;

  return (
    <div className={`flex items-center gap-3 w-full px-3 py-3 rounded-[8px] transition-all duration-200 group ${active ? 'bg-surface' : 'hover:bg-hover'}`}>
      <div className="relative flex items-center justify-center w-8 h-8">
        <Bell 
          size={24} 
          className={`transition-all duration-300 ${active ? 'text-brand fill-brand' : 'text-text-primary group-hover:scale-110'}`} 
          strokeWidth={2}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-brand text-white text-[10px] font-bold h-4.5 w-4.5 flex items-center justify-center rounded-full border-2 border-background shadow-sm animate-in zoom-in duration-300">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>
      {!collapsed && (
        <span className={`text-[17px] font-medium tracking-tight transition-colors duration-200 ${active ? 'text-brand' : 'text-text-primary'}`}>
          {t('activity')}
        </span>
      )}
    </div>
  );
}
