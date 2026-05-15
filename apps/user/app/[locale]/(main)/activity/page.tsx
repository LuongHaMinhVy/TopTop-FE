"use client";

import { useTranslations } from "next-intl";
import { useNotifications, useMarkReadMutation } from "@/hooks/notification-hooks";
import { Avatar } from "@repo/ui";
import { Heart, MessageCircle, UserPlus, Circle, BellOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import * as locales from "date-fns/locale";
import { usePathname } from "next/navigation";
import Image from "next/image";
import type { Notification } from "@/types/notification";

export default function ActivityPage() {
  const t = useTranslations('Main');
  const { data: notificationsData, isLoading } = useNotifications();
  const markRead = useMarkReadMutation();
  const pathname = usePathname();
  
  const localeStr = pathname.split('/')[1] || 'vi';
  const dateLocale = localeStr === 'vi' ? locales.vi : locales.enUS;

  const notifications = notificationsData?.data || [];

  const getIcon = (type: string) => {
    switch (type) {
      case 'LIKE': return <Heart className="w-4 h-4 fill-brand text-brand" />;
      case 'COMMENT': return <MessageCircle className="w-4 h-4 fill-blue-500 text-blue-500" />;
      case 'FOLLOW': return <UserPlus className="w-4 h-4 text-purple-500" />;
      default: return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="max-w-[600px] mx-auto p-4 sm:p-6 pb-24 lg:pb-6">
      <h1 className="text-[24px] font-bold mb-6">{t('sidebar.activity')}</h1>

      <div className="flex flex-col gap-1">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-elevated" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-elevated rounded w-3/4" />
                <div className="h-3 bg-elevated rounded w-1/4" />
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-elevated/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BellOff className="w-10 h-10 text-text-muted" />
            </div>
            <p className="text-text-secondary font-medium">{t('notifications.empty')}</p>
          </div>
        ) : (
          notifications.map((notification: Notification) => (
            <div 
              key={notification.id}
              className={`flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer group ${notification.isRead ? 'opacity-70 hover:opacity-100' : 'bg-brand/5 hover:bg-brand/10'}`}
              onClick={() => {
                if (!notification.isRead) markRead.mutate(notification.id);
              }}
            >
              <div className="relative flex-shrink-0">
                <Avatar src={notification.actorAvatarUrl} alt={notification.actorUsername} size="lg" />
                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 shadow-sm">
                  {getIcon(notification.type)}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[15px] leading-tight mb-1">
                  <span className="font-bold hover:underline cursor-pointer">@{notification.actorUsername}</span>
                  {" "}{notification.content}
                </p>
                <p className="text-[13px] text-text-muted">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: dateLocale })}
                </p>
              </div>

              {notification.videoId && (
                <div className="relative w-12 h-16 rounded-md overflow-hidden bg-black flex-shrink-0 border border-elevated">
                  <Image 
                    src={notification.videoThumbnailUrl || ""} 
                    alt="Video thumbnail"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
